insert into storage.buckets(id,name,public,file_size_limit) values('ebg-studio-private','ebg-studio-private',false,2147483648) on conflict(id) do update set public=false;
create policy "Private Studio uploads read" on storage.objects for select to authenticated using(bucket_id='ebg-studio-private' and (public.can_write_studio_media(name) or ((storage.foldername(name))[1]='catalog' and ((storage.foldername(name))[2]=auth.uid()::text or public.studio_is_global() or ((storage.foldername(name))[3] in ('series','episodes') and public.studio_can_edit_show((storage.foldername(name))[4]))))));
create policy "Private Studio uploads insert" on storage.objects for insert to authenticated with check(bucket_id='ebg-studio-private' and (public.can_write_studio_media(name) or ((storage.foldername(name))[1]='catalog' and (storage.foldername(name))[2]=auth.uid()::text and (public.is_staff() or public.can_use_private_studio()))));
create policy "Private Studio uploads update" on storage.objects for update to authenticated using(bucket_id='ebg-studio-private' and (public.can_write_studio_media(name) or ((storage.foldername(name))[1]='catalog' and (storage.foldername(name))[2]=auth.uid()::text and (public.is_staff() or public.can_use_private_studio())))) with check(bucket_id='ebg-studio-private' and (public.can_write_studio_media(name) or ((storage.foldername(name))[1]='catalog' and (storage.foldername(name))[2]=auth.uid()::text and (public.is_staff() or public.can_use_private_studio()))));
create policy "Private Studio uploads delete" on storage.objects for delete to authenticated using(bucket_id='ebg-studio-private' and (public.can_write_studio_media(name) or ((storage.foldername(name))[1]='catalog' and (storage.foldername(name))[2]=auth.uid()::text and (public.is_staff() or public.can_use_private_studio()))));
create or replace function public.assert_private_media_access(p_value jsonb,p_owner uuid,p_project uuid default null) returns void language plpgsql set search_path=public as $$
declare v jsonb; path text; parts text[];
begin
 for v in select jsonb_path_query(p_value,'$.** ? (@.type() == "string")') loop
   path := substring(trim(both '"' from v::text) from '/functions/v1/studio-media\?path=([^&"]+)');
   if path is null then continue; end if;
   path := replace(replace(path,'%2F','/'),'%2f','/'); parts := string_to_array(path,'/');
   if parts[1]='studio' then
     if parts[2] is distinct from p_owner::text or (p_project is not null and parts[3] is distinct from p_project::text) or not exists(select 1 from public.studio_projects where id::text=parts[3] and owner_account_id=p_owner) then raise exception 'Private media belongs to another production'; end if;
   elsif parts[1]='catalog' then
     if p_project is not null then raise exception 'Use media uploaded to this production'; end if;
     if parts[2] is distinct from p_owner::text and not public.studio_is_global() and not (parts[3] in ('series','episodes') and public.studio_can_edit_show(parts[4])) then raise exception 'Private show media access required'; end if;
   else raise exception 'Invalid private media reference'; end if;
 end loop;
end $$;
revoke all on function public.assert_private_media_access(jsonb,uuid,uuid) from public,anon;
grant execute on function public.assert_private_media_access(jsonb,uuid,uuid) to authenticated;
create or replace function public.validate_project_private_media() returns trigger language plpgsql set search_path=public as $$
begin
 perform public.assert_private_media_access(new.cms,new.owner_account_id,new.id);
 return new;
end $$;
revoke all on function public.validate_project_private_media() from public,anon,authenticated;
create trigger validate_project_private_media before insert or update of cms on public.studio_projects for each row execute function public.validate_project_private_media();
create or replace function public.studio_save_cms(p_value jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not (public.is_staff() or public.can_use_private_studio()) then raise exception 'Studio access required'; end if;
 perform public.assert_private_media_access(jsonb_build_object('shows',p_value->'shows','episodes',p_value->'episodes'),auth.uid());
 return public.studio_save_cms_scoped_legacy(p_value);
end $$;
revoke execute on function public.studio_save_cms_scoped_legacy(jsonb) from authenticated;
revoke insert,update,delete on public.cms_settings from authenticated;
