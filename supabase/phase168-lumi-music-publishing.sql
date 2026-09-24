-- Lumi can publish a reviewed music release to the private project and public EBG+ Music catalog.

create or replace function public.publish_lumi_music_release(
  p_project_id uuid,
  p_artist_name text,
  p_title text,
  p_release_type text,
  p_genre text default '',
  p_cover text default '',
  p_release_date text default null,
  p_publish_status text default 'draft',
  p_explicit boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.studio_projects%rowtype;
  v_identity public.studio_identities%rowtype;
  v_public jsonb;
  v_private jsonb;
  v_music jsonb;
  v_public_music jsonb;
  v_artist_id text;
  v_release_id text;
  v_artist jsonb;
  v_release jsonb;
  v_now timestamptz := now();
  v_slug text;
begin
  if nullif(trim(p_artist_name),'') is null or nullif(trim(p_title),'') is null then
    raise exception 'Artist and release title are required.';
  end if;

  if lower(p_release_type) not in ('single','ep','album') then
    raise exception 'Release type must be single, ep, or album.';
  end if;

  if lower(p_publish_status) not in ('draft','scheduled','live') then
    raise exception 'Publish status must be draft, scheduled, or live.';
  end if;

  select * into v_project
  from public.studio_projects
  where id = p_project_id
    and owner_account_id = auth.uid()
  for update;

  if not found then
    raise exception 'You do not own this Studio project.';
  end if;

  select * into v_identity
  from public.studio_identities
  where id = v_project.identity_id
    and account_id = auth.uid();

  if not found then
    raise exception 'Your Studio identity could not be verified.';
  end if;

  v_private := coalesce(v_project.cms, '{}'::jsonb);
  v_music := coalesce(v_private->'music', jsonb_build_object(
    'artists','[]'::jsonb,
    'releases','[]'::jsonb,
    'tracks','[]'::jsonb,
    'videos','[]'::jsonb
  ));

  v_slug := lower(regexp_replace(trim(p_artist_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'artist'; end if;

  select coalesce(
    (
      select e->>'id'
      from jsonb_array_elements(coalesce(v_music->'artists','[]'::jsonb)) e
      where lower(e->>'name') = lower(trim(p_artist_name))
      limit 1
    ),
    'lumi-' || replace(p_project_id::text,'-','') || '-' || v_slug
  ) into v_artist_id;

  if not exists (
    select 1
    from jsonb_array_elements(coalesce(v_music->'artists','[]'::jsonb)) e
    where e->>'id' = v_artist_id
  ) then
    v_artist := jsonb_build_object(
      'id', v_artist_id,
      'name', trim(p_artist_name),
      'image', '',
      'bio', '',
      'label', coalesce(nullif(v_identity.company_name,''), v_identity.display_name),
      'sourceProjectId', p_project_id::text
    );
    v_music := jsonb_set(
      v_music,
      '{artists}',
      coalesce(v_music->'artists','[]'::jsonb) || jsonb_build_array(v_artist),
      true
    );
  end if;

  v_release_id := 'lumi-' || replace(p_project_id::text,'-','') || '-' || floor(extract(epoch from v_now) * 1000)::bigint::text;

  v_release := jsonb_build_object(
    'id', v_release_id,
    'artistId', v_artist_id,
    'title', trim(p_title),
    'type', lower(p_release_type),
    'genre', trim(coalesce(p_genre,'')),
    'cover', trim(coalesce(p_cover,'')),
    'releaseDate', coalesce(nullif(trim(coalesce(p_release_date,'')),''), to_char(v_now at time zone 'UTC','YYYY-MM-DD')),
    'publishStatus', lower(p_publish_status),
    'explicit', coalesce(p_explicit,false),
    'sourceProjectId', p_project_id::text
  );

  v_music := jsonb_set(
    v_music,
    '{releases}',
    coalesce(v_music->'releases','[]'::jsonb) || jsonb_build_array(v_release),
    true
  );

  v_private := jsonb_set(v_private, '{music}', v_music, true);

  update public.studio_projects
  set cms = v_private,
      updated_at = v_now
  where id = p_project_id
    and owner_account_id = auth.uid();

  select value into v_public
  from public.cms_settings
  where key='cms'
  for update;

  v_public := coalesce(v_public, '{}'::jsonb);
  v_public_music := coalesce(v_public->'music', jsonb_build_object(
    'artists','[]'::jsonb,
    'releases','[]'::jsonb,
    'tracks','[]'::jsonb,
    'videos','[]'::jsonb
  ));

  if not exists (
    select 1 from jsonb_array_elements(coalesce(v_public_music->'artists','[]'::jsonb)) e
    where e->>'id' = v_artist_id
  ) then
    v_artist := jsonb_build_object(
      'id', v_artist_id,
      'name', trim(p_artist_name),
      'image', '',
      'bio', '',
      'label', coalesce(nullif(v_identity.company_name,''), v_identity.display_name),
      'sourceProjectId', p_project_id::text
    );
    v_public_music := jsonb_set(
      v_public_music,
      '{artists}',
      coalesce(v_public_music->'artists','[]'::jsonb) || jsonb_build_array(v_artist),
      true
    );
  end if;

  v_public_music := jsonb_set(
    v_public_music,
    '{releases}',
    coalesce(v_public_music->'releases','[]'::jsonb) || jsonb_build_array(v_release),
    true
  );

  v_public := jsonb_set(v_public, '{music}', v_public_music, true);

  insert into public.cms_settings(key,value,updated_at)
  values ('cms',v_public,v_now)
  on conflict (key) do update
    set value=excluded.value,
        updated_at=excluded.updated_at;

  return jsonb_build_object(
    'ok',true,
    'kind','music',
    'id',v_release_id,
    'artistId',v_artist_id,
    'publishStatus',lower(p_publish_status)
  );
end;
$$;

revoke all on function public.publish_lumi_music_release(uuid,text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.publish_lumi_music_release(uuid,text,text,text,text,text,text,text,boolean) to authenticated;
