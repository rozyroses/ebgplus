-- Custom URLs are unique across productions; unpublished targets remain private.
create table public.studio_streaming_links (
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  release_id text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}(/[a-z0-9][a-z0-9-]{1,79})?$'),
  public_id text generated always as (
    case when release_id like 'lumi-' || replace(project_id::text,'-','') || '-%'
      then release_id else 'project-' || project_id::text || '-' || release_id end
  ) stored,
  primary key (project_id,release_id)
);
alter table public.studio_streaming_links enable row level security;
create policy "Owners can read their streaming links" on public.studio_streaming_links for select to authenticated
using (exists(select 1 from public.studio_projects p where p.id=project_id and p.owner_account_id=(select auth.uid())));
create policy "Only published streaming links are public" on public.studio_streaming_links for select to anon,authenticated
using (exists(select 1 from public.cms_settings c, jsonb_array_elements(coalesce(c.value->'music'->'releases','[]'::jsonb)) r where c.key='cms' and r->>'id'=public_id and r->>'publishStatus' in ('live','scheduled')));
create policy "Owners can create streaming links for their releases" on public.studio_streaming_links for insert to authenticated
with check (exists(select 1 from public.studio_projects p, jsonb_array_elements(coalesce(p.cms->'music'->'releases','[]'::jsonb)) r where p.id=project_id and p.owner_account_id=(select auth.uid()) and r->>'id'=release_id));
create policy "Owners can update streaming links for their releases" on public.studio_streaming_links for update to authenticated
using (exists(select 1 from public.studio_projects p where p.id=project_id and p.owner_account_id=(select auth.uid())))
with check (exists(select 1 from public.studio_projects p, jsonb_array_elements(coalesce(p.cms->'music'->'releases','[]'::jsonb)) r where p.id=project_id and p.owner_account_id=(select auth.uid()) and r->>'id'=release_id));
grant select on public.studio_streaming_links to anon;
grant select,insert,update on public.studio_streaming_links to authenticated;
grant all on public.studio_streaming_links to service_role;
