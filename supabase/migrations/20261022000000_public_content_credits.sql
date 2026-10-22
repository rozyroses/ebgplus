-- Resolve public bylines from Studio ownership and the current approved identity.
-- Only catalog entries are exposed; private project data never leaves this function.
create or replace function public.public_content_credits()
returns table (content_type text, content_id text, creator_name text, studio_name text, verified boolean, badge_tone text)
language sql stable security definer
set search_path = ''
as $$
  with catalog as (
    select value from public.cms_settings where key = 'cms'
  ),
  show_credits as (
    select distinct on (s.item->>'id')
      'show'::text as content_type,
      s.item->>'id' as content_id,
      i.display_name as creator_name,
      nullif(i.company_name, '') as studio_name,
      i.verified,
      i.badge_tone
    from catalog c
    cross join lateral jsonb_array_elements(coalesce(c.value->'shows', '[]'::jsonb)) s(item)
    join public.studio_show_access a on a.show_id = s.item->>'id' and a.access_role = 'owner'
    join public.studio_projects p on p.owner_account_id = a.account_id
      and exists (
        select 1 from jsonb_array_elements(coalesce(p.cms->'shows', '[]'::jsonb)) ps(item)
        where ps.item->>'id' = s.item->>'id'
      )
    join public.studio_identities i on i.id = p.identity_id and i.account_id = a.account_id
    where nullif(s.item->>'id', '') is not null
    order by s.item->>'id', a.created_at, p.id
  ),
  release_credits as (
    select distinct on (r.item->>'id')
      'release'::text as content_type,
      r.item->>'id' as content_id,
      i.display_name as creator_name,
      nullif(i.company_name, '') as studio_name,
      i.verified,
      i.badge_tone
    from catalog c
    cross join lateral jsonb_array_elements(coalesce(c.value->'music'->'releases', '[]'::jsonb)) r(item)
    join public.studio_projects p on left(r.item->>'id', length('project-' || p.id::text || '-')) = 'project-' || p.id::text || '-'
    join public.studio_identities i on i.id = p.identity_id and i.account_id = p.owner_account_id
    where r.item->>'publishStatus' = 'live'
      or (r.item->>'publishStatus' = 'scheduled' and (r.item->>'releaseDate')::timestamptz <= now())
    order by r.item->>'id', p.created_at, p.id
  )
  select * from show_credits
  union all
  select * from release_credits;
$$;

revoke all on function public.public_content_credits() from public;
grant execute on function public.public_content_credits() to anon, authenticated;
