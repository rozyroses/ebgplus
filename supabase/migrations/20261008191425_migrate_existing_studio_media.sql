-- Copy files through the Storage API before running this migration.
-- Derive all paths from existing records; stop if a private copy is missing.
-- Run the owner-checked projection while each project owner context is active.
set constraints sync_studio_project_music immediate;
do $$
declare item record; project record; saved_subject text := current_setting('request.jwt.claim.sub',true); encoded text; old_url text; raw_url text; new_url text;
begin
 if exists(select 1 from storage.objects source left join storage.objects dest on dest.bucket_id='ebg-studio-private' and dest.name=source.name where source.bucket_id='ebg-media' and source.name like 'studio/%' and (dest.id is null or source.metadata->>'size' is distinct from dest.metadata->>'size')) then raise exception 'Private copies must be verified before changing media links'; end if;
 for item in select name from storage.objects where bucket_id='ebg-media' and name like 'studio/%' loop
   select string_agg(case when b between 48 and 57 or b between 65 and 90 or b between 97 and 122 or b in(45,46,95,126) then chr(b) else '%'||upper(lpad(to_hex(b),2,'0')) end,'' order by i) into encoded from (select i,get_byte(convert_to(item.name,'UTF8'),i) b from generate_series(0,octet_length(item.name)-1) i) bytes;
   old_url := 'https://dilhuwhqkrhknhrsngud.supabase.co/storage/v1/object/public/ebg-media/' || replace(encoded,'%2F','/');
   raw_url := 'https://dilhuwhqkrhknhrsngud.supabase.co/storage/v1/object/public/ebg-media/' || item.name;
   new_url := 'https://dilhuwhqkrhknhrsngud.supabase.co/functions/v1/studio-media?path=' || encoded;
   update public.cms_settings set value=replace(replace(value::text,old_url,new_url),raw_url,new_url)::jsonb,updated_at=now() where key='cms' and (strpos(value::text,old_url)>0 or strpos(value::text,raw_url)>0);
   for project in select id,owner_account_id from public.studio_projects where strpos(cms::text,old_url)>0 or strpos(cms::text,raw_url)>0 loop
     -- The existing projection trigger validates the owner even during maintenance.
     perform set_config('request.jwt.claim.sub',project.owner_account_id::text,true);
     update public.studio_projects set cms=replace(replace(cms::text,old_url,new_url),raw_url,new_url)::jsonb,updated_at=now() where id=project.id;
   end loop;
   update public.lumi_chats set messages=replace(replace(messages::text,old_url,new_url),raw_url,new_url)::jsonb where strpos(messages::text,old_url)>0 or strpos(messages::text,raw_url)>0;
 end loop;
 perform set_config('request.jwt.claim.sub',coalesce(saved_subject,''),true);
end $$;
