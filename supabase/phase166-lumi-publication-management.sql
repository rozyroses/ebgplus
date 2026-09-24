-- Manage Lumi publications already pushed into the public CMS.
-- Every action is scoped to the signed-in owner's Studio project.

create or replace function public.list_lumi_publications(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cms jsonb;
begin
  if not exists (
    select 1 from public.studio_projects
    where id = p_project_id and owner_account_id = auth.uid()
  ) then
    raise exception 'You do not own this Studio project.';
  end if;

  select value into v_cms
  from public.cms_settings
  where key = 'cms';

  v_cms := coalesce(v_cms, '{}'::jsonb);

  return coalesce((
    select jsonb_agg(item order by published_at desc)
    from (
      select
        (entry || jsonb_build_object('kind','news')) as item,
        coalesce(entry->>'publishedAt','') as published_at
      from jsonb_array_elements(coalesce(v_cms->'news','[]'::jsonb)) entry
      where entry->>'sourceProjectId' = p_project_id::text

      union all

      select
        (entry || jsonb_build_object('kind','notification')) as item,
        coalesce(entry->>'date','') as published_at
      from jsonb_array_elements(coalesce(v_cms->'notifications','[]'::jsonb)) entry
      where entry->>'sourceProjectId' = p_project_id::text
    ) q
  ), '[]'::jsonb);
end;
$$;

create or replace function public.update_lumi_publication(
  p_project_id uuid,
  p_kind text,
  p_id text,
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
  v_cms jsonb;
  v_found boolean := false;
  v_now timestamptz := now();
begin
  if p_kind not in ('news','notification') then
    raise exception 'Unsupported Lumi publication type.';
  end if;

  if nullif(trim(p_title),'') is null or nullif(trim(p_body),'') is null then
    raise exception 'A title and body are required.';
  end if;

  if not exists (
    select 1 from public.studio_projects
    where id = p_project_id and owner_account_id = auth.uid()
  ) then
    raise exception 'You do not own this Studio project.';
  end if;

  select value into v_cms
  from public.cms_settings
  where key = 'cms'
  for update;

  v_cms := coalesce(v_cms, '{}'::jsonb);

  if p_kind = 'news' then
    select exists(
      select 1 from jsonb_array_elements(coalesce(v_cms->'news','[]'::jsonb)) e
      where e->>'id' = p_id and e->>'sourceProjectId' = p_project_id::text
    ) into v_found;

    if not v_found then raise exception 'News post not found for this project.'; end if;

    v_cms := jsonb_set(v_cms, '{news}', (
      select coalesce(jsonb_agg(
        case
          when e->>'id' = p_id and e->>'sourceProjectId' = p_project_id::text then
            e || jsonb_build_object(
              'headline', trim(p_title),
              'summary', left(trim(regexp_replace(p_body, '\s+', ' ', 'g')), 180),
              'body', trim(p_body),
              'updatedAt', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )
          else e
        end
      ), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_cms->'news','[]'::jsonb)) e
    ), true);
  else
    select exists(
      select 1 from jsonb_array_elements(coalesce(v_cms->'notifications','[]'::jsonb)) e
      where e->>'id' = p_id and e->>'sourceProjectId' = p_project_id::text
    ) into v_found;

    if not v_found then raise exception 'Notification not found for this project.'; end if;

    v_cms := jsonb_set(v_cms, '{notifications}', (
      select coalesce(jsonb_agg(
        case
          when e->>'id' = p_id and e->>'sourceProjectId' = p_project_id::text then
            e || jsonb_build_object(
              'title', trim(p_title),
              'text', trim(p_body),
              'link', nullif(trim(coalesce(p_link,'')), ''),
              'updatedAt', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )
          else e
        end
      ), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_cms->'notifications','[]'::jsonb)) e
    ), true);
  end if;

  update public.cms_settings
  set value = v_cms, updated_at = v_now
  where key = 'cms';

  return jsonb_build_object('ok',true,'id',p_id,'kind',p_kind,'updatedAt',v_now);
end;
$$;

create or replace function public.delete_lumi_publication(
  p_project_id uuid,
  p_kind text,
  p_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cms jsonb;
  v_before int;
  v_after int;
  v_now timestamptz := now();
begin
  if p_kind not in ('news','notification') then
    raise exception 'Unsupported Lumi publication type.';
  end if;

  if not exists (
    select 1 from public.studio_projects
    where id = p_project_id and owner_account_id = auth.uid()
  ) then
    raise exception 'You do not own this Studio project.';
  end if;

  select value into v_cms
  from public.cms_settings
  where key = 'cms'
  for update;

  v_cms := coalesce(v_cms, '{}'::jsonb);

  if p_kind = 'news' then
    v_before := jsonb_array_length(coalesce(v_cms->'news','[]'::jsonb));
    v_cms := jsonb_set(v_cms, '{news}', (
      select coalesce(jsonb_agg(e), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_cms->'news','[]'::jsonb)) e
      where not (e->>'id' = p_id and e->>'sourceProjectId' = p_project_id::text)
    ), true);
    v_after := jsonb_array_length(coalesce(v_cms->'news','[]'::jsonb));
  else
    v_before := jsonb_array_length(coalesce(v_cms->'notifications','[]'::jsonb));
    v_cms := jsonb_set(v_cms, '{notifications}', (
      select coalesce(jsonb_agg(e), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_cms->'notifications','[]'::jsonb)) e
      where not (e->>'id' = p_id and e->>'sourceProjectId' = p_project_id::text)
    ), true);
    v_after := jsonb_array_length(coalesce(v_cms->'notifications','[]'::jsonb));
  end if;

  if v_before = v_after then
    raise exception 'Publication not found for this project.';
  end if;

  update public.cms_settings
  set value = v_cms, updated_at = v_now
  where key = 'cms';

  return jsonb_build_object('ok',true,'id',p_id,'kind',p_kind);
end;
$$;

revoke all on function public.list_lumi_publications(uuid) from public;
revoke all on function public.update_lumi_publication(uuid,text,text,text,text,text) from public;
revoke all on function public.delete_lumi_publication(uuid,text,text) from public;

grant execute on function public.list_lumi_publications(uuid) to authenticated;
grant execute on function public.update_lumi_publication(uuid,text,text,text,text,text) to authenticated;
grant execute on function public.delete_lumi_publication(uuid,text,text) to authenticated;
