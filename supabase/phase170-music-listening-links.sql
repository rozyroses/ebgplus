-- Publish listening links only; private distribution metadata stays in the owner-scoped project.
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
      when 'releases' then array['id','artistId','title','type','genre','cover','releaseDate','publishStatus','explicit','streamingLinks']
      when 'tracks' then array['id','artistId','releaseId','title','audioUrl','audioMimeType','losslessUrl','losslessMimeType','atmosUrl','sampleRate','bitDepth','trackNumber','duration','explicit','lyrics','timedLyrics']
      else array['id','artistId','trackId','title','videoUrl','thumbnail','releaseDate','publishStatus'] end;
    projected := '[]'::jsonb;
    for item in select value from jsonb_array_elements(case field when 'artists' then artists when 'releases' then releases when 'tracks' then tracks else videos end) loop
      select coalesce(jsonb_object_agg(key,value),'{}') into clean from jsonb_each(item) where key=any(allowed);
      if field = 'releases' and clean ? 'streamingLinks' then
        clean := jsonb_set(clean, '{streamingLinks}', (
          select coalesce(jsonb_object_agg(key,value),'{}'::jsonb)
          from jsonb_each(case when jsonb_typeof(clean->'streamingLinks')='object' then clean->'streamingLinks' else '{}'::jsonb end)
          where key in ('spotify','apple','youtube','amazon','tidal','deezer') and jsonb_typeof(value)='string' and value #>> '{}' like 'https://%'
        ));
      end if;
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

