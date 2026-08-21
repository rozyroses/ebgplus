-- EBG Studio Phase 1.46 — show-scoped creator access
-- Run once in Supabase SQL Editor before enabling scoped Studio access.

create table if not exists public.studio_global_access (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  granted_by uuid references public.accounts(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.studio_show_access (
  show_id text not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  access_role text not null default 'editor' check (access_role in ('owner','producer','editor','viewer')),
  granted_by uuid references public.accounts(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (show_id, account_id)
);

create index if not exists studio_show_access_account_idx
  on public.studio_show_access (account_id, show_id);

alter table public.studio_global_access enable row level security;
alter table public.studio_show_access enable row level security;

create or replace function public.studio_is_global(p_account_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.role in ('administrator','founder')
  ) or exists (
    select 1
    from public.studio_global_access g
    where g.account_id = p_account_id
  );
$$;

create or replace function public.studio_can_access_show(p_show_id text, p_account_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.studio_is_global(p_account_id)
    or exists (
      select 1
      from public.studio_show_access s
      where s.show_id = p_show_id
        and s.account_id = p_account_id
    );
$$;

revoke all on function public.studio_is_global(uuid) from public;
revoke all on function public.studio_can_access_show(text, uuid) from public;
grant execute on function public.studio_is_global(uuid) to authenticated;
grant execute on function public.studio_can_access_show(text, uuid) to authenticated;

drop policy if exists "studio global access read" on public.studio_global_access;
create policy "studio global access read" on public.studio_global_access
for select to authenticated
using (account_id = auth.uid() or public.studio_is_global());

drop policy if exists "studio global access manage" on public.studio_global_access;
create policy "studio global access manage" on public.studio_global_access
for all to authenticated
using (public.studio_is_global())
with check (public.studio_is_global());

drop policy if exists "studio show access read" on public.studio_show_access;
create policy "studio show access read" on public.studio_show_access
for select to authenticated
using (account_id = auth.uid() or public.studio_is_global());

drop policy if exists "studio show access manage" on public.studio_show_access;
create policy "studio show access manage" on public.studio_show_access
for all to authenticated
using (public.studio_is_global())
with check (public.studio_is_global());

-- Return the full CMS to global staff and a show-scoped CMS to creators.
create or replace function public.studio_load_cms()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_value jsonb;
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_staff() then
    raise exception 'Studio staff access required.';
  end if;

  select value into v_value
  from public.cms_settings
  where key = 'cms';

  if v_value is null then
    return null;
  end if;

  if public.studio_is_global() then
    return v_value;
  end if;

  v_result := v_value;

  v_result := jsonb_set(
    v_result,
    '{shows}',
    coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(coalesce(v_value->'shows', '[]'::jsonb)) item
      where public.studio_can_access_show(item->>'id')
    ), '[]'::jsonb),
    true
  );

  v_result := jsonb_set(
    v_result,
    '{episodes}',
    coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(coalesce(v_value->'episodes', '[]'::jsonb)) item
      where public.studio_can_access_show(item->>'showId')
    ), '[]'::jsonb),
    true
  );

  v_result := jsonb_set(
    v_result,
    '{comingSoon}',
    coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(coalesce(v_value->'comingSoon', '[]'::jsonb)) item
      where public.studio_can_access_show(trim(both '"' from item::text))
    ), '[]'::jsonb),
    true
  );

  if not public.studio_can_access_show(coalesce(v_value->>'heroShowId', '')) then
    v_result := jsonb_set(v_result, '{heroShowId}', '""'::jsonb, true);
  end if;

  return v_result;
end;
$$;

-- Scoped staff submit only their visible slice. The function merges it into the
-- canonical CMS so another creator's shows/episodes can never be overwritten.
create or replace function public.studio_save_cms(p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current jsonb;
  v_merged jsonb;
  v_incoming_shows jsonb := coalesce(p_value->'shows', '[]'::jsonb);
  v_incoming_episodes jsonb := coalesce(p_value->'episodes', '[]'::jsonb);
  v_new_show_id text;
begin
  if auth.uid() is null or not public.is_staff() then
    raise exception 'Studio staff access required.';
  end if;

  select value into v_current
  from public.cms_settings
  where key = 'cms'
  for update;

  if public.studio_is_global() then
    insert into public.cms_settings (key, value, updated_at)
    values ('cms', p_value, now())
    on conflict (key) do update
      set value = excluded.value,
          updated_at = excluded.updated_at;
    return p_value;
  end if;

  v_current := coalesce(v_current, '{}'::jsonb);

  -- A scoped creator may edit only existing shows already assigned to them.
  if exists (
    select 1
    from jsonb_array_elements(v_incoming_shows) incoming
    where exists (
      select 1
      from jsonb_array_elements(coalesce(v_current->'shows', '[]'::jsonb)) existing
      where existing->>'id' = incoming->>'id'
    )
      and not public.studio_can_access_show(incoming->>'id')
  ) then
    raise exception 'You do not have access to one or more submitted shows.';
  end if;

  -- New show IDs become owned by the creator who created them.
  for v_new_show_id in
    select incoming->>'id'
    from jsonb_array_elements(v_incoming_shows) incoming
    where nullif(incoming->>'id', '') is not null
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(v_current->'shows', '[]'::jsonb)) existing
        where existing->>'id' = incoming->>'id'
      )
  loop
    insert into public.studio_show_access (show_id, account_id, access_role, granted_by)
    values (v_new_show_id, auth.uid(), 'owner', auth.uid())
    on conflict (show_id, account_id) do update
      set access_role = 'owner';
  end loop;

  -- Keep inaccessible shows untouched; replace the caller's accessible slice.
  v_merged := jsonb_set(
    v_current,
    '{shows}',
    coalesce((
      select jsonb_agg(item)
      from (
        select existing as item
        from jsonb_array_elements(coalesce(v_current->'shows', '[]'::jsonb)) existing
        where not public.studio_can_access_show(existing->>'id')
        union all
        select incoming as item
        from jsonb_array_elements(v_incoming_shows) incoming
      ) merged_shows
    ), '[]'::jsonb),
    true
  );

  -- Same rule for episodes: preserve other productions and replace only the caller's slice.
  v_merged := jsonb_set(
    v_merged,
    '{episodes}',
    coalesce((
      select jsonb_agg(item)
      from (
        select existing as item
        from jsonb_array_elements(coalesce(v_current->'episodes', '[]'::jsonb)) existing
        where not public.studio_can_access_show(existing->>'showId')
        union all
        select incoming as item
        from jsonb_array_elements(v_incoming_episodes) incoming
        where public.studio_can_access_show(incoming->>'showId')
      ) merged_episodes
    ), '[]'::jsonb),
    true
  );

  -- Homepage rails, global notifications, slogan, and featured hero remain global-only.
  v_merged := jsonb_set(v_merged, '{rails}', coalesce(v_current->'rails', '[]'::jsonb), true);
  v_merged := jsonb_set(v_merged, '{comingSoon}', coalesce(v_current->'comingSoon', '[]'::jsonb), true);
  v_merged := jsonb_set(v_merged, '{notifications}', coalesce(v_current->'notifications', '[]'::jsonb), true);
  v_merged := jsonb_set(v_merged, '{heroShowId}', coalesce(v_current->'heroShowId', '""'::jsonb), true);
  if v_current ? 'slogan' then
    v_merged := jsonb_set(v_merged, '{slogan}', v_current->'slogan', true);
  end if;

  insert into public.cms_settings (key, value, updated_at)
  values ('cms', v_merged, now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = excluded.updated_at;

  -- Remove stale ownership/access rows for shows deleted from the canonical CMS.
  delete from public.studio_show_access access_row
  where not exists (
    select 1
    from jsonb_array_elements(coalesce(v_merged->'shows', '[]'::jsonb)) item
    where item->>'id' = access_row.show_id
  );

  return public.studio_load_cms();
end;
$$;

grant execute on function public.studio_load_cms() to authenticated;
grant execute on function public.studio_save_cms(jsonb) to authenticated;

-- Only global staff can bypass the scoped CMS RPC with a direct write.
drop policy if exists "cms staff write" on public.cms_settings;
drop policy if exists "cms global write" on public.cms_settings;
create policy "cms global write" on public.cms_settings
for all to authenticated
using (public.studio_is_global())
with check (public.studio_is_global());

-- Casting rows are visible/updateable only when the staff member can access that show.
drop policy if exists "casting staff read" on public.casting_applications;
drop policy if exists "casting staff update" on public.casting_applications;
create policy "casting studio scoped read" on public.casting_applications
for select to authenticated
using (public.studio_can_access_show(show_id));
create policy "casting studio scoped update" on public.casting_applications
for update to authenticated
using (public.studio_can_access_show(show_id))
with check (public.studio_can_access_show(show_id));

-- Poll drafts and management are show-scoped. Published polls remain publicly readable.
drop policy if exists "Public can read published polls" on public.polls;
drop policy if exists "Staff can create polls" on public.polls;
drop policy if exists "Staff can update polls" on public.polls;
drop policy if exists "Staff can delete polls" on public.polls;

create policy "Published or scoped polls read" on public.polls
for select
using (status in ('open','closed') or public.studio_can_access_show(show_id));

create policy "Scoped staff can create polls" on public.polls
for insert to authenticated
with check (public.studio_can_access_show(show_id));

create policy "Scoped staff can update polls" on public.polls
for update to authenticated
using (public.studio_can_access_show(show_id))
with check (public.studio_can_access_show(show_id));

create policy "Scoped staff can delete polls" on public.polls
for delete to authenticated
using (public.studio_can_access_show(show_id));

-- Poll option writes follow the parent poll's show access.
drop policy if exists "Staff can create poll options" on public.poll_options;
drop policy if exists "Staff can update poll options" on public.poll_options;
drop policy if exists "Staff can delete poll options" on public.poll_options;

create policy "Scoped staff can create poll options" on public.poll_options
for insert to authenticated
with check (exists (
  select 1 from public.polls p
  where p.id = poll_options.poll_id
    and public.studio_can_access_show(p.show_id)
));

create policy "Scoped staff can update poll options" on public.poll_options
for update to authenticated
using (exists (
  select 1 from public.polls p
  where p.id = poll_options.poll_id
    and public.studio_can_access_show(p.show_id)
))
with check (exists (
  select 1 from public.polls p
  where p.id = poll_options.poll_id
    and public.studio_can_access_show(p.show_id)
));

create policy "Scoped staff can delete poll options" on public.poll_options
for delete to authenticated
using (exists (
  select 1 from public.polls p
  where p.id = poll_options.poll_id
    and public.studio_can_access_show(p.show_id)
));

-- Helpers for assigning access from the SQL editor or a future Team UI.
create or replace function public.studio_set_global_access(p_account_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.studio_is_global() then
    raise exception 'Global Studio access required.';
  end if;
  if p_enabled then
    insert into public.studio_global_access (account_id, granted_by)
    values (p_account_id, auth.uid())
    on conflict (account_id) do nothing;
  else
    delete from public.studio_global_access where account_id = p_account_id;
  end if;
end;
$$;

grant execute on function public.studio_set_global_access(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
