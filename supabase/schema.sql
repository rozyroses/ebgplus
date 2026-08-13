create extension if not exists pgcrypto;

create type public.ebg_role as enum ('viewer', 'editor', 'producer', 'administrator', 'founder');

create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.ebg_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  avatar text not null default '✨',
  autoplay_next boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.watchlist (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  show_id text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, show_id)
);

create table public.playback_progress (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  episode_id text not null,
  seconds integer not null default 0 check (seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (profile_id, episode_id)
);

create table public.casting_applications (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references auth.users(id) on delete set null,
  legal_name text not null,
  age integer not null check (age >= 21),
  city_state text not null,
  email text not null,
  relationship_goals text not null,
  camera_comfort text not null,
  status text not null default 'New' check (status in ('New','Reviewing','Callback','Interview','Finalist','Cast','Declined','Removed')),
  created_at timestamptz not null default now()
);

create table public.cms_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.accounts (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;

  insert into public.profiles (account_id, name, avatar)
  values (new.id, 'Main Profile', '✨');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.accounts
    where id = auth.uid()
      and role in ('editor','producer','administrator','founder')
  );
$$;

alter table public.accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.playback_progress enable row level security;
alter table public.casting_applications enable row level security;
alter table public.cms_settings enable row level security;

create policy "accounts read own" on public.accounts
for select using (id = auth.uid() or public.is_staff());

create policy "profiles own account" on public.profiles
for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy "watchlist own profile" on public.watchlist
for all using (exists (select 1 from public.profiles p where p.id = profile_id and p.account_id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = profile_id and p.account_id = auth.uid()));

create policy "playback own profile" on public.playback_progress
for all using (exists (select 1 from public.profiles p where p.id = profile_id and p.account_id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = profile_id and p.account_id = auth.uid()));

create policy "casting submit authenticated" on public.casting_applications
for insert to authenticated with check (submitted_by = auth.uid());

create policy "casting staff read" on public.casting_applications
for select using (public.is_staff());

create policy "casting staff update" on public.casting_applications
for update using (public.is_staff()) with check (public.is_staff());

create policy "cms public read" on public.cms_settings
for select using (true);

create policy "cms staff write" on public.cms_settings
for all using (public.is_staff()) with check (public.is_staff());
