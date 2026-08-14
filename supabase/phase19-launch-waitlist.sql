-- EBG+ Phase 1.9 launch waitlist + staff stats
-- Run once in the Supabase SQL editor. This file is written to be safe to re-run.

create table if not exists public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  consent_at timestamptz not null default now(),
  notified_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint launch_waitlist_email_normalized check (email = lower(trim(email)))
);

alter table public.launch_waitlist enable row level security;

revoke all on table public.launch_waitlist from anon, authenticated;

drop policy if exists "launch waitlist staff read" on public.launch_waitlist;
create policy "launch waitlist staff read"
on public.launch_waitlist for select to authenticated
using (public.is_staff());

drop policy if exists "launch waitlist staff update" on public.launch_waitlist;
create policy "launch waitlist staff update"
on public.launch_waitlist for update to authenticated
using (public.is_staff())
with check (public.is_staff());

create or replace function public.join_launch_waitlist(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_email = '' or length(v_email) > 320 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.';
  end if;

  insert into public.launch_waitlist (email, consent_at, unsubscribed_at)
  values (v_email, now(), null)
  on conflict (email) do update
    set consent_at = now(),
        unsubscribed_at = null;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.join_launch_waitlist(text) from public;
grant execute on function public.join_launch_waitlist(text) to anon, authenticated;

create or replace function public.unsubscribe_launch_waitlist(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_count integer;
begin
  begin
    v_token := p_token::uuid;
  exception when others then
    return jsonb_build_object('ok', false);
  end;

  update public.launch_waitlist
  set unsubscribed_at = now()
  where unsubscribe_token = v_token
    and unsubscribed_at is null;

  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', v_count > 0);
end;
$$;

revoke all on function public.unsubscribe_launch_waitlist(text) from public;
grant execute on function public.unsubscribe_launch_waitlist(text) to anon, authenticated;

create or replace function public.get_launch_waitlist_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_active integer;
  v_notified integer;
  v_unsubscribed integer;
begin
  if not public.is_staff() then
    raise exception 'Not authorized.';
  end if;

  select count(*)::int into v_total from public.launch_waitlist;
  select count(*)::int into v_active from public.launch_waitlist where unsubscribed_at is null;
  select count(*)::int into v_notified from public.launch_waitlist where notified_at is not null and unsubscribed_at is null;
  select count(*)::int into v_unsubscribed from public.launch_waitlist where unsubscribed_at is not null;

  return jsonb_build_object(
    'total', v_total,
    'active', v_active,
    'notified', v_notified,
    'unsubscribed', v_unsubscribed
  );
end;
$$;

revoke all on function public.get_launch_waitlist_stats() from public;
grant execute on function public.get_launch_waitlist_stats() to authenticated;
