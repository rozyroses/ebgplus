-- EBG Network Phase 1.60 — Studio Forms, applicant messaging, notifications, verified badges

alter table public.accounts
  add column if not exists verified_badge text check (verified_badge in ('artist','founder'));

update public.accounts
set verified_badge = 'founder'
where role = 'founder' and verified_badge is distinct from 'founder';

create table if not exists public.ebg_application_messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ebg_form_submissions(id) on delete cascade,
  sender_account_id uuid not null references public.accounts(id) on delete cascade default auth.uid(),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.account_notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  title text not null,
  text text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.ebg_application_messages enable row level security;
alter table public.account_notifications enable row level security;

create or replace function public.ebg_submission_account_id(p_submission_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    s.submitted_by,
    (select a.id from public.accounts a where lower(a.email) = lower(s.respondent_email) limit 1)
  )
  from public.ebg_form_submissions s
  where s.id = p_submission_id;
$$;

revoke all on function public.ebg_submission_account_id(uuid) from public;
grant execute on function public.ebg_submission_account_id(uuid) to authenticated;

drop policy if exists "Applicants can read their EBG submissions" on public.ebg_form_submissions;
create policy "Applicants can read their EBG submissions"
on public.ebg_form_submissions for select to authenticated
using (
  submitted_by = auth.uid()
  or lower(coalesce(respondent_email,'')) = lower(coalesce((select email from public.accounts where id = auth.uid()),''))
  or public.is_ebg_staff()
);

drop policy if exists "Applicants and staff can read form messages" on public.ebg_application_messages;
create policy "Applicants and staff can read form messages"
on public.ebg_application_messages for select to authenticated
using (public.is_ebg_staff() or public.ebg_submission_account_id(submission_id) = auth.uid());

drop policy if exists "Applicants and staff can send form messages" on public.ebg_application_messages;
create policy "Applicants and staff can send form messages"
on public.ebg_application_messages for insert to authenticated
with check (
  sender_account_id = auth.uid()
  and (public.is_ebg_staff() or public.ebg_submission_account_id(submission_id) = auth.uid())
);

drop policy if exists "Users can read their notifications" on public.account_notifications;
create policy "Users can read their notifications"
on public.account_notifications for select to authenticated
using (account_id = auth.uid() or public.is_ebg_staff());

drop policy if exists "Users can update their notifications" on public.account_notifications;
create policy "Users can update their notifications"
on public.account_notifications for update to authenticated
using (account_id = auth.uid()) with check (account_id = auth.uid());

drop policy if exists "Staff can send account notifications" on public.account_notifications;
create policy "Staff can send account notifications"
on public.account_notifications for insert to authenticated
with check (public.is_ebg_staff());

grant select, insert on public.ebg_application_messages to authenticated;
grant select, update, insert on public.account_notifications to authenticated;

create or replace function public.notify_submission_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_account_id uuid; v_form_title text; v_public_status text;
begin
  if new.status is not distinct from old.status then return new; end if;
  v_account_id := coalesce(new.submitted_by,(select a.id from public.accounts a where lower(a.email)=lower(new.respondent_email) limit 1));
  if v_account_id is null then return new; end if;
  select title into v_form_title from public.ebg_forms where id=new.form_id;
  v_public_status := case new.status when 'new' then 'Submitted' when 'reviewing' then 'Under Review' when 'contacted' then 'Next Step' when 'accepted' then 'Accepted' when 'declined' then 'Closed' else initcap(new.status) end;
  insert into public.account_notifications(account_id,title,text,link)
  values(v_account_id,coalesce(v_form_title,'EBG Application')||' update','Your application status is now '||v_public_status||'.','/app/applications');
  return new;
end; $$;

drop trigger if exists ebg_submission_status_notification on public.ebg_form_submissions;
create trigger ebg_submission_status_notification after update of status on public.ebg_form_submissions for each row execute function public.notify_submission_status_change();

create or replace function public.notify_application_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_sender_role text;
begin
  select role into v_sender_role from public.accounts where id=new.sender_account_id;
  v_owner := public.ebg_submission_account_id(new.submission_id);
  if v_owner is not null and new.sender_account_id<>v_owner and v_sender_role in ('founder','administrator','producer','editor') then
    insert into public.account_notifications(account_id,title,text,link)
    values(v_owner,'New message from EBG',left(new.body,180),'/app/applications');
  end if;
  return new;
end; $$;

drop trigger if exists ebg_application_message_notification on public.ebg_application_messages;
create trigger ebg_application_message_notification after insert on public.ebg_application_messages for each row execute function public.notify_application_message();

create or replace function public.set_account_verified_badge(p_account_id uuid,p_badge text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.accounts where id=auth.uid() and role='founder') then raise exception 'Founder access required.'; end if;
  if p_badge is not null and p_badge not in ('artist','founder') then raise exception 'Invalid verification badge.'; end if;
  update public.accounts set verified_badge=p_badge where id=p_account_id;
end; $$;

grant execute on function public.set_account_verified_badge(uuid,text) to authenticated;
