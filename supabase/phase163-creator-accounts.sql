-- EBG+ creator accounts + private Studio ownership
-- Separates public account type from legacy internal staff role so self-service
-- creator/producer signups never inherit broad staff access.

alter table public.accounts
  add column if not exists account_type text not null default 'viewer'
  check (account_type in ('viewer','creator','producer','founder'));

update public.accounts
set account_type = case
  when role = 'founder' then 'founder'
  when role = 'producer' then 'producer'
  else account_type
end;

create table if not exists public.studio_identities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  identity_type text not null check (identity_type in ('creator','producer','founder')),
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  company_name text check (company_name is null or char_length(trim(company_name)) between 1 and 100),
  bio text not null default '',
  verified boolean not null default false,
  badge_tone text not null default 'blue' check (badge_tone in ('blue','violet','gold','green')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references public.accounts(id) on delete cascade,
  identity_id uuid not null references public.studio_identities(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  slug text not null check (char_length(trim(slug)) between 1 and 140),
  project_kind text not null default 'show' check (project_kind in ('show','music','mixed')),
  cms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_account_id, slug)
);

create index if not exists studio_projects_owner_idx on public.studio_projects(owner_account_id);
create index if not exists studio_projects_identity_idx on public.studio_projects(identity_id);

alter table public.studio_identities enable row level security;
alter table public.studio_projects enable row level security;

drop policy if exists "Studio identities are private to their account" on public.studio_identities;
create policy "Studio identities are private to their account"
on public.studio_identities for all to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

drop policy if exists "Studio projects are private to their owner" on public.studio_projects;
create policy "Studio projects are private to their owner"
on public.studio_projects for all to authenticated
using (owner_account_id = auth.uid())
with check (
  owner_account_id = auth.uid()
  and exists (
    select 1 from public.studio_identities si
    where si.id = identity_id and si.account_id = auth.uid()
  )
);

grant select, insert, update, delete on public.studio_identities to authenticated;
grant select, insert, update, delete on public.studio_projects to authenticated;

-- Existing internal producer/founder accounts receive an identity without changing
-- their current permissions. New self-service producers remain legacy role=viewer.
insert into public.studio_identities(account_id, identity_type, display_name, company_name, verified, badge_tone)
select
  a.id,
  case when a.role = 'founder' then 'founder' else 'producer' end,
  coalesce(nullif(split_part(a.email,'@',1),''),'EBG Creator'),
  null,
  a.role = 'founder',
  case when a.role = 'founder' then 'gold' else 'violet' end
from public.accounts a
where a.role in ('producer','founder')
on conflict (account_id) do nothing;

-- Preserve the current shared EBG catalog for existing founders as their own
-- private starting production. This intentionally does not expose it to other accounts.
insert into public.studio_projects(owner_account_id, identity_id, title, slug, project_kind, cms)
select
  a.id,
  si.id,
  'EBG Productions',
  'ebg-productions',
  'mixed',
  coalesce((select value from public.cms_settings where key='cms' limit 1), '{}'::jsonb)
from public.accounts a
join public.studio_identities si on si.account_id=a.id
where a.role='founder'
on conflict (owner_account_id, slug) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_account_type text;
  v_display_name text;
  v_company_name text;
  v_identity_type text;
  v_badge_tone text;
begin
  v_account_type := lower(coalesce(new.raw_user_meta_data->>'account_type','viewer'));
  if v_account_type not in ('viewer','creator','producer') then
    v_account_type := 'viewer';
  end if;

  v_display_name := trim(coalesce(new.raw_user_meta_data->>'display_name',''));
  if v_display_name = '' then
    v_display_name := coalesce(nullif(split_part(new.email,'@',1),''),'Main Profile');
  end if;

  v_company_name := nullif(trim(coalesce(new.raw_user_meta_data->>'company_name','')),'');

  insert into public.accounts (id, email, role, account_type)
  values (new.id, new.email, 'viewer', v_account_type)
  on conflict (id) do update
    set email = excluded.email,
        account_type = excluded.account_type;

  insert into public.profiles (account_id, name, avatar)
  values (new.id, left(v_display_name,40), '✨')
  on conflict do nothing;

  if v_account_type in ('creator','producer') then
    v_identity_type := v_account_type;
    v_badge_tone := case when v_account_type='producer' then 'violet' else 'blue' end;

    insert into public.studio_identities(
      account_id, identity_type, display_name, company_name, verified, badge_tone
    )
    values (
      new.id,
      v_identity_type,
      left(v_display_name,80),
      case when v_company_name is null then null else left(v_company_name,100) end,
      false,
      v_badge_tone
    )
    on conflict (account_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.can_use_private_studio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.accounts
    where id=auth.uid()
      and account_type in ('creator','producer','founder')
  );
$$;

revoke all on function public.can_use_private_studio() from public;
grant execute on function public.can_use_private_studio() to authenticated;
