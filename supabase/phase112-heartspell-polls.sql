-- EBG+ Phase 1.12 — Heartspell House live polls
-- Run this file once in Supabase SQL Editor after merging Phase 1.12.

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  show_id text not null default 'heartspell-house',
  question text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','open','closed')),
  opens_at timestamptz,
  closes_at timestamptz,
  results_visibility text not null default 'live' check (results_visibility in ('live','after_close','hidden')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

create or replace function public.is_ebg_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts
    where id = auth.uid()
      and role in ('founder','administrator','producer','editor')
  );
$$;

revoke all on function public.is_ebg_staff() from public;
grant execute on function public.is_ebg_staff() to authenticated;

create policy "Public can read published polls"
on public.polls for select
using (status in ('open','closed') or public.is_ebg_staff());

create policy "Staff can create polls"
on public.polls for insert
to authenticated
with check (public.is_ebg_staff());

create policy "Staff can update polls"
on public.polls for update
to authenticated
using (public.is_ebg_staff())
with check (public.is_ebg_staff());

create policy "Staff can delete polls"
on public.polls for delete
to authenticated
using (public.is_ebg_staff());

create policy "Public can read options for published polls"
on public.poll_options for select
using (
  exists (
    select 1 from public.polls p
    where p.id = poll_options.poll_id
      and (p.status in ('open','closed') or public.is_ebg_staff())
  )
);

create policy "Staff can create poll options"
on public.poll_options for insert
to authenticated
with check (public.is_ebg_staff());

create policy "Staff can update poll options"
on public.poll_options for update
to authenticated
using (public.is_ebg_staff())
with check (public.is_ebg_staff());

create policy "Staff can delete poll options"
on public.poll_options for delete
to authenticated
using (public.is_ebg_staff());

-- Vote rows stay private. Fans never select raw voter records.
create policy "Fans can insert their own vote"
on public.poll_votes for insert
to authenticated
with check (voter_id = auth.uid());

create or replace function public.cast_poll_vote(p_poll_id uuid, p_option_id uuid)
returns table (poll_id uuid, option_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll public.polls;
begin
  if auth.uid() is null then
    raise exception 'Sign in to vote.';
  end if;

  select * into v_poll from public.polls where id = p_poll_id;
  if v_poll.id is null then raise exception 'Poll not found.'; end if;
  if v_poll.status <> 'open' then raise exception 'This poll is not open.'; end if;
  if v_poll.opens_at is not null and now() < v_poll.opens_at then raise exception 'Voting has not opened yet.'; end if;
  if v_poll.closes_at is not null and now() >= v_poll.closes_at then raise exception 'Voting has closed.'; end if;
  if not exists (select 1 from public.poll_options where id = p_option_id and poll_options.poll_id = p_poll_id) then
    raise exception 'That option does not belong to this poll.';
  end if;

  insert into public.poll_votes (poll_id, option_id, voter_id)
  values (p_poll_id, p_option_id, auth.uid())
  on conflict (poll_id, voter_id)
  do update set option_id = excluded.option_id, created_at = now();

  return query select p_poll_id, p_option_id;
end;
$$;

grant execute on function public.cast_poll_vote(uuid, uuid) to authenticated;

create or replace function public.get_poll_results(p_poll_id uuid)
returns table (
  option_id uuid,
  label text,
  position integer,
  votes bigint,
  percentage numeric,
  total_votes bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll public.polls;
  v_total bigint;
  v_can_view boolean := false;
begin
  select * into v_poll from public.polls where id = p_poll_id;
  if v_poll.id is null then raise exception 'Poll not found.'; end if;

  v_can_view := public.is_ebg_staff()
    or v_poll.results_visibility = 'live'
    or (v_poll.results_visibility = 'after_close' and v_poll.status = 'closed');

  if not v_can_view then
    raise exception 'Results are not available yet.';
  end if;

  select count(*) into v_total from public.poll_votes where poll_votes.poll_id = p_poll_id;

  return query
  select
    o.id,
    o.label,
    o.position,
    count(v.id)::bigint,
    case when v_total = 0 then 0 else round((count(v.id)::numeric * 100) / v_total, 1) end,
    v_total
  from public.poll_options o
  left join public.poll_votes v on v.option_id = o.id
  where o.poll_id = p_poll_id
  group by o.id, o.label, o.position
  order by o.position asc, o.created_at asc;
end;
$$;

grant execute on function public.get_poll_results(uuid) to anon, authenticated;

grant select on public.polls, public.poll_options to anon, authenticated;
grant insert, update, delete on public.polls, public.poll_options to authenticated;
grant insert on public.poll_votes to authenticated;
