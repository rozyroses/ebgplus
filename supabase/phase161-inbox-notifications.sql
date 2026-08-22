-- EBG Network Phase 1.61 — Inbox, thread states, unread messaging

alter table public.ebg_application_messages
  add column if not exists sender_label text,
  add column if not exists read_by_applicant boolean not null default false,
  add column if not exists read_by_staff boolean not null default false;

alter table public.ebg_form_submissions
  add column if not exists conversation_state text not null default 'open'
    check (conversation_state in ('open','waiting_on_ebg','waiting_on_applicant','resolved')),
  add column if not exists last_message_at timestamptz;

alter table public.account_notifications
  add column if not exists kind text,
  add column if not exists submission_id uuid references public.ebg_form_submissions(id) on delete cascade;

create index if not exists ebg_application_messages_submission_created_idx
  on public.ebg_application_messages(submission_id, created_at desc);
create index if not exists ebg_form_submissions_last_message_idx
  on public.ebg_form_submissions(last_message_at desc nulls last);
create index if not exists account_notifications_account_created_idx
  on public.account_notifications(account_id, created_at desc);

create or replace function public.prepare_application_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_owner uuid;
begin
  select role into v_role from public.accounts where id = new.sender_account_id;
  v_owner := public.ebg_submission_account_id(new.submission_id);

  if new.sender_label is null or btrim(new.sender_label) = '' then
    new.sender_label := case
      when v_role in ('founder','administrator','producer','editor') then 'EBG Team'
      else 'Applicant'
    end;
  end if;

  if new.sender_account_id = v_owner then
    new.read_by_applicant := true;
    new.read_by_staff := false;
  else
    new.read_by_applicant := false;
    new.read_by_staff := true;
  end if;

  return new;
end;
$$;

drop trigger if exists ebg_prepare_application_message on public.ebg_application_messages;
create trigger ebg_prepare_application_message
before insert on public.ebg_application_messages
for each row execute function public.prepare_application_message();

create or replace function public.sync_application_conversation_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  v_owner := public.ebg_submission_account_id(new.submission_id);
  update public.ebg_form_submissions
  set last_message_at = new.created_at,
      conversation_state = case
        when new.sender_account_id = v_owner then 'waiting_on_ebg'
        else 'waiting_on_applicant'
      end,
      updated_at = now()
  where id = new.submission_id;
  return new;
end;
$$;

drop trigger if exists ebg_sync_application_conversation_state on public.ebg_application_messages;
create trigger ebg_sync_application_conversation_state
after insert on public.ebg_application_messages
for each row execute function public.sync_application_conversation_state();

create or replace function public.notify_application_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_sender_role text;
  v_form_title text;
begin
  select role into v_sender_role from public.accounts where id = new.sender_account_id;
  v_owner := public.ebg_submission_account_id(new.submission_id);
  select f.title into v_form_title
  from public.ebg_form_submissions s join public.ebg_forms f on f.id = s.form_id
  where s.id = new.submission_id;

  if v_owner is not null and new.sender_account_id <> v_owner and v_sender_role in ('founder','administrator','producer','editor') then
    insert into public.account_notifications(account_id,title,text,link,kind,submission_id)
    values(v_owner,coalesce(v_form_title,'EBG Application') || ' · New message',left(new.body,180),'/app/inbox','application_message',new.submission_id);
  end if;
  return new;
end;
$$;

create or replace function public.mark_application_thread_read(p_submission_id uuid, p_side text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_side = 'applicant' then
    if public.ebg_submission_account_id(p_submission_id) <> auth.uid() then
      raise exception 'Not allowed.';
    end if;
    update public.ebg_application_messages
    set read_by_applicant = true
    where submission_id = p_submission_id and read_by_applicant = false;
  elsif p_side = 'staff' then
    if not public.is_ebg_staff() then raise exception 'Staff access required.'; end if;
    update public.ebg_application_messages
    set read_by_staff = true
    where submission_id = p_submission_id and read_by_staff = false;
  else
    raise exception 'Invalid side.';
  end if;
end;
$$;

grant execute on function public.mark_application_thread_read(uuid,text) to authenticated;

create or replace function public.mark_all_account_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.account_notifications set read = true where account_id = auth.uid() and read = false;
$$;

grant execute on function public.mark_all_account_notifications_read() to authenticated;

create or replace function public.set_application_conversation_state(p_submission_id uuid, p_state text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ebg_staff() then raise exception 'Staff access required.'; end if;
  if p_state not in ('open','waiting_on_ebg','waiting_on_applicant','resolved') then raise exception 'Invalid conversation state.'; end if;
  update public.ebg_form_submissions set conversation_state = p_state, updated_at = now() where id = p_submission_id;
end;
$$;

grant execute on function public.set_application_conversation_state(uuid,text) to authenticated;

-- Users should only see their own account notifications in EBG+.
drop policy if exists "Users can read their notifications" on public.account_notifications;
create policy "Users can read their notifications"
on public.account_notifications for select to authenticated
using (account_id = auth.uid());
