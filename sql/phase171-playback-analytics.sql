create table if not exists public.playback_sessions (
  id uuid primary key,
  account_id uuid not null default auth.uid() references public.accounts(id) on delete cascade,
  content_id text not null check (length(content_id) between 1 and 250),
  content_kind text not null check (content_kind in ('video','music')),
  title text not null check (length(title) between 1 and 300),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  played_seconds numeric not null default 0 check (played_seconds between 0 and 86400),
  completed boolean not null default false
);
create index if not exists playback_sessions_started_idx on public.playback_sessions(started_at);
alter table public.playback_sessions enable row level security;
revoke all on public.playback_sessions from anon, authenticated;
grant select, insert, update on public.playback_sessions to authenticated;
create policy "session read owner or staff" on public.playback_sessions for select to authenticated using (account_id = (select auth.uid()) or (select public.is_ebg_staff()));
create policy "session insert owner" on public.playback_sessions for insert to authenticated with check (account_id = (select auth.uid()) and started_at between now() - interval '5 minutes' and now() + interval '1 minute');
create policy "session update owner" on public.playback_sessions for update to authenticated using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));
create or replace function public.record_playback_session(p_id uuid, p_content_id text, p_kind text, p_title text, p_seconds numeric, p_completed boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign-in required'; end if;
  insert into public.playback_sessions(id, account_id, content_id, content_kind, title, played_seconds, completed)
  values(p_id, auth.uid(), p_content_id, p_kind, p_title, greatest(0,least(86400,p_seconds)),p_completed)
  on conflict(id) do update set played_seconds=greatest(playback_sessions.played_seconds,excluded.played_seconds), completed=playback_sessions.completed or excluded.completed, updated_at=now()
  where playback_sessions.account_id=auth.uid() and playback_sessions.content_id=excluded.content_id and playback_sessions.content_kind=excluded.content_kind;
end $$;
revoke all on function public.record_playback_session(uuid,text,text,text,numeric,boolean) from public,anon;
grant execute on function public.record_playback_session(uuid,text,text,text,numeric,boolean) to authenticated;
create or replace function public.studio_playback_analytics(p_days integer default 30)
returns jsonb language plpgsql stable security invoker set search_path=public as $$
declare result jsonb;
begin
  if auth.uid() is null or not public.is_ebg_staff() then raise exception 'Staff access required'; end if;
  with filtered as (select * from public.playback_sessions where started_at >= now() - make_interval(days=>greatest(1,least(90,p_days)))),
  totals as (select count(*) plays,count(distinct account_id) viewers,coalesce(sum(played_seconds),0) seconds,count(*) filter(where completed) finishes from filtered),
  ranked as (select content_id,content_kind,max(title) title,count(*) plays,coalesce(sum(played_seconds),0) seconds,count(*) filter(where completed) finishes from filtered group by content_id,content_kind order by count(*) desc limit 50),
  daily as (select (started_at at time zone 'America/New_York')::date as day,count(*) plays,coalesce(sum(played_seconds),0) seconds from filtered group by 1 order by 1)
  select jsonb_build_object('totals',(select to_jsonb(totals) from totals),'content',coalesce((select jsonb_agg(to_jsonb(ranked)) from ranked),'[]'::jsonb),'daily',coalesce((select jsonb_agg(to_jsonb(daily)) from daily),'[]'::jsonb),'trackingStarted','2026-10-07') into result;
  return result;
end $$;
revoke all on function public.studio_playback_analytics(integer) from public,anon;
grant execute on function public.studio_playback_analytics(integer) to authenticated;
