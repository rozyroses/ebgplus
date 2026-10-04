-- Approved music is a public projection; the underlying project remains private.
create schema if not exists studio_internal;
revoke all on schema studio_internal from public, anon, authenticated;

create or replace function studio_internal.music_id(project_id uuid, item_id text)
returns text language sql immutable security invoker set search_path = '' as $$
  select case when item_id like 'lumi-' || replace(project_id::text,'-','') || '-%'
    then item_id else 'project-' || project_id::text || '-' || item_id end
$$;

create or replace function studio_internal.project_music(public_music jsonb, project_id uuid, project_music jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  output jsonb := coalesce(public_music,'{}'::jsonb);
  releases jsonb; tracks jsonb; videos jsonb; artists jsonb;
  field text; allowed text[]; projected jsonb; retained jsonb; item jsonb; clean jsonb;
begin
  select coalesce(jsonb_agg(e),'[]') into releases from jsonb_array_elements(coalesce(project_music->'releases','[]')) e
    where e->>'publishStatus' in ('live','scheduled') and nullif(e->>'id','') is not null;
  select coalesce(jsonb_agg(e),'[]') into tracks from jsonb_array_elements(coalesce(project_music->'tracks','[]')) e
    where nullif(e->>'id','') is not null and exists(select 1 from jsonb_array_elements(releases) r where r->>'id'=e->>'releaseId');
  select coalesce(jsonb_agg(e),'[]') into videos from jsonb_array_elements(coalesce(project_music->'videos','[]')) e
    where e->>'publishStatus' in ('live','scheduled') and nullif(e->>'id','') is not null;
  select coalesce(jsonb_agg(e),'[]') into artists from jsonb_array_elements(coalesce(project_music->'artists','[]')) e
    where nullif(e->>'id','') is not null and (
      exists(select 1 from jsonb_array_elements(releases) r where r->>'artistId'=e->>'id') or
      exists(select 1 from jsonb_array_elements(videos) v where v->>'artistId'=e->>'id'));
  foreach field in array array['artists','releases','tracks','videos'] loop
    allowed := case field
      when 'artists' then array['id','name','image','bio','label']
      when 'releases' then array['id','artistId','title','type','genre','cover','releaseDate','publishStatus','explicit']
      when 'tracks' then array['id','artistId','releaseId','title','audioUrl','audioMimeType','losslessUrl','losslessMimeType','atmosUrl','sampleRate','bitDepth','trackNumber','duration','explicit','lyrics','timedLyrics']
      else array['id','artistId','trackId','title','videoUrl','thumbnail','releaseDate','publishStatus'] end;
    projected := '[]'::jsonb;
    for item in select value from jsonb_array_elements(case field when 'artists' then artists when 'releases' then releases when 'tracks' then tracks else videos end) loop
      select coalesce(jsonb_object_agg(key,value),'{}') into clean from jsonb_each(item) where key=any(allowed);
      clean := clean || jsonb_build_object('id',studio_internal.music_id(project_id,item->>'id'),'sourceProjectId',project_id::text);
      if item ? 'artistId' then clean := clean || jsonb_build_object('artistId',studio_internal.music_id(project_id,item->>'artistId')); end if;
      if nullif(item->>'releaseId','') is not null then clean := clean || jsonb_build_object('releaseId',studio_internal.music_id(project_id,item->>'releaseId')); end if;
      if nullif(item->>'trackId','') is not null then clean := clean || jsonb_build_object('trackId',studio_internal.music_id(project_id,item->>'trackId')); end if;
      projected := projected || jsonb_build_array(clean);
    end loop;
    select coalesce(jsonb_agg(e),'[]') into retained from jsonb_array_elements(coalesce(output->field,'[]')) e where e->>'sourceProjectId' is distinct from project_id::text;
    output := jsonb_set(output,array[field],retained || projected,true);
  end loop;
  if exists(select 1 from jsonb_array_elements(releases) r where r->>'id'=project_music->>'featuredReleaseId') then
    output := output || jsonb_build_object('featuredReleaseId',studio_internal.music_id(project_id,project_music->>'featuredReleaseId'));
  elsif not exists(select 1 from jsonb_array_elements(output->'releases') r where r->>'id'=output->>'featuredReleaseId') then
    output := output - 'featuredReleaseId';
  end if;
  return output;
end
$$;

create or replace function studio_internal.sync_music()
returns trigger language plpgsql security definer set search_path = '' as $$
declare catalog jsonb;
begin
  if tg_op='UPDATE' and new.cms->'music' is not distinct from old.cms->'music' then return new; end if;
  if auth.uid() is null or auth.uid() <> new.owner_account_id then raise exception 'Project owner authentication required.'; end if;
  if not exists(select 1 from public.studio_identities where id=new.identity_id and account_id=auth.uid()) then raise exception 'Project identity verification required.'; end if;
  insert into public.cms_settings(key,value,updated_at) values('cms','{}',now()) on conflict(key) do nothing;
  select coalesce(value,'{}') into catalog from public.cms_settings where key='cms' for update;
  catalog := jsonb_set(catalog,'{music}',studio_internal.project_music(catalog->'music',new.id,coalesce(new.cms->'music','{}')),true);
  update public.cms_settings set value=catalog,updated_at=now() where key='cms';
  return new;
end
$$;
revoke all on all functions in schema studio_internal from public, anon, authenticated;
-- End-of-transaction syncing also reconciles the legacy Lumi publication path.
create constraint trigger sync_studio_project_music
  after insert or update on public.studio_projects
  deferrable initially deferred for each row execute function studio_internal.sync_music();

-- Regression checks run within the migration transaction.
do $$
declare projected jsonb; pid uuid := '00000000-0000-0000-0000-000000000001';
begin
  projected := studio_internal.project_music(
    '{"releases":[{"id":"unrelated","title":"Other project"}],"tracks":[],"artists":[],"videos":[]}', pid,
    '{"artists":[{"id":"a","name":"Artist","privateNote":"hidden"}],"releases":[{"id":"r","artistId":"a","title":"Live","publishStatus":"live"},{"id":"draft","artistId":"a","publishStatus":"draft"}],"tracks":[{"id":"t","artistId":"a","releaseId":"r","losslessUrl":"https://media.example/master.flac"},{"id":"private","releaseId":"draft"}],"videos":[]}');
  if jsonb_array_length(projected->'releases')<>2 or jsonb_array_length(projected->'tracks')<>1 then raise exception 'Publication filtering regression'; end if;
  if projected->'artists'->0 ? 'privateNote' then raise exception 'Private metadata leak'; end if;
  if projected->'tracks'->0->>'releaseId' <> projected->'releases'->1->>'id' then raise exception 'Broken release reference'; end if;
  projected := studio_internal.project_music(projected,pid,'{"artists":[],"releases":[],"tracks":[],"videos":[]}');
  if jsonb_array_length(projected->'releases')<>1 or jsonb_array_length(projected->'tracks')<>0 then raise exception 'Unpublish regression'; end if;
end $$;
