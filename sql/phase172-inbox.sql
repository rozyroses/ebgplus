alter table public.ebg_form_submissions add column if not exists conversation_state text not null default 'open' check (conversation_state in ('open','waiting_on_ebg','waiting_on_applicant','resolved'));
alter table public.ebg_application_messages add column if not exists sender_label text;
alter table public.ebg_application_messages add column if not exists read_by_staff boolean not null default false;
grant update(read_by_staff) on public.ebg_application_messages to authenticated;
create policy "Staff mark messages read" on public.ebg_application_messages for update to authenticated using(public.is_ebg_staff()) with check(public.is_ebg_staff());
create or replace function public.mark_application_thread_read(p_submission_id uuid,p_side text default 'staff') returns void language plpgsql security invoker set search_path=public as $$
begin
 if auth.uid() is null or not public.is_ebg_staff() or p_side <> 'staff' then raise exception 'Staff access required'; end if;
 update public.ebg_application_messages set read_by_staff=true where submission_id=p_submission_id;
end $$;
create or replace function public.set_application_conversation_state(p_submission_id uuid,p_state text) returns void language plpgsql security invoker set search_path=public as $$
begin
 if auth.uid() is null or not public.is_ebg_staff() then raise exception 'Staff access required'; end if;
 if p_state not in ('open','waiting_on_ebg','waiting_on_applicant','resolved') then raise exception 'Invalid conversation state'; end if;
 update public.ebg_form_submissions set conversation_state=p_state,updated_at=now() where id=p_submission_id;
 if not found then raise exception 'Conversation not found'; end if;
end $$;
revoke all on function public.mark_application_thread_read(uuid,text),public.set_application_conversation_state(uuid,text) from public,anon;
grant execute on function public.mark_application_thread_read(uuid,text),public.set_application_conversation_state(uuid,text) to authenticated;
