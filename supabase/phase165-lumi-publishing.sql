-- Lumi controlled publishing to public EBG+ surfaces.
-- The signed-in account must own the selected Studio project.
-- Lumi can append a public news post or viewer notification after explicit review.

create or replace function public.publish_lumi_content(
  p_project_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_link text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.studio_projects%rowtype;
  v_identity public.studio_identities%rowtype;
  v_cms jsonb;
  v_item jsonb;
  v_now timestamptz := now();
  v_id text;
begin
  if p_kind not in ('news','notification') then
    raise exception 'Unsupported Lumi publication type.';
  end if;

  if nullif(trim(p_title),'') is null or nullif(trim(p_body),'') is null then
    raise exception 'A title and body are required.';
  end if;

  select *
  into v_project
  from public.studio_projects
  where id = p_project_id
    and owner_account_id = auth.uid();

  if not found then
    raise exception 'You do not own this Studio project.';
  end if;

  select *
  into v_identity
  from public.studio_identities
  where id = v_project.identity_id
    and account_id = auth.uid();

  if not found then
    raise exception 'Your Studio identity could not be verified.';
  end if;

  select value
  into v_cms
  from public.cms_settings
  where key = 'cms'
  for update;

  if v_cms is null then
    v_cms := '{}'::jsonb;
  end if;

  v_id := 'lumi-' || replace(p_project_id::text, '-', '') || '-' || floor(extract(epoch from v_now) * 1000)::bigint::text;

  if p_kind = 'news' then
    v_item := jsonb_build_object(
      'id', v_id,
      'headline', trim(p_title),
      'summary', left(trim(regexp_replace(p_body, '\s+', ' ', 'g')), 180),
      'body', trim(p_body),
      'category', 'Studio',
      'author', coalesce(nullif(v_identity.company_name,''), v_identity.display_name),
      'image', '',
      'featured', false,
      'status', 'published',
      'publishedAt', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'sourceProjectId', p_project_id::text
    );

    v_cms := jsonb_set(
      v_cms,
      '{news}',
      coalesce(v_cms->'news', '[]'::jsonb) || jsonb_build_array(v_item),
      true
    );
  else
    v_item := jsonb_build_object(
      'id', v_id,
      'title', trim(p_title),
      'text', trim(p_body),
      'date', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'read', false,
      'audience', 'all',
      'status', 'sent',
      'link', nullif(trim(coalesce(p_link,'')), ''),
      'sourceProjectId', p_project_id::text
    );

    v_cms := jsonb_set(
      v_cms,
      '{notifications}',
      jsonb_build_array(v_item) || coalesce(v_cms->'notifications', '[]'::jsonb),
      true
    );
  end if;

  insert into public.cms_settings(key, value, updated_at)
  values ('cms', v_cms, v_now)
  on conflict (key) do update
    set value = excluded.value,
        updated_at = excluded.updated_at;

  return jsonb_build_object(
    'ok', true,
    'kind', p_kind,
    'id', v_id,
    'publishedAt', v_now
  );
end;
$$;

revoke all on function public.publish_lumi_content(uuid,text,text,text,text) from public;
grant execute on function public.publish_lumi_content(uuid,text,text,text,text) to authenticated;
