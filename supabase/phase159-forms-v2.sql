-- EBG Forms 2.0 — live dashboard + legacy sundown
-- Run once in Supabase SQL Editor before enabling the new Forms UI.

create table if not exists public.ebg_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  eyebrow text not null default 'EBG Forms',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','open','closed')),
  submit_message text not null default 'Thanks — your response has been received.',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ebg_form_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.ebg_forms(id) on delete cascade,
  label text not null,
  key text not null,
  type text not null default 'text' check (type in ('text','email','number','textarea','select')),
  required boolean not null default true,
  position integer not null default 0,
  options jsonb,
  placeholder text,
  created_at timestamptz not null default now(),
  unique(form_id, key)
);

create table if not exists public.ebg_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.ebg_forms(id) on delete cascade,
  respondent_email text,
  status text not null default 'new' check (status in ('new','reviewing','contacted','accepted','declined')),
  internal_notes text not null default '',
  answers jsonb not null default '{}'::jsonb,
  source text not null default 'forms.ebgplus.app',
  submitted_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ebg_forms enable row level security;
alter table public.ebg_form_questions enable row level security;
alter table public.ebg_form_submissions enable row level security;

drop policy if exists "Public can read open EBG forms" on public.ebg_forms;
create policy "Public can read open EBG forms" on public.ebg_forms for select
using (status = 'open' or public.is_ebg_staff());

drop policy if exists "Public can read open EBG form questions" on public.ebg_form_questions;
create policy "Public can read open EBG form questions" on public.ebg_form_questions for select
using (
  exists (
    select 1 from public.ebg_forms f
    where f.id = ebg_form_questions.form_id
      and (f.status = 'open' or public.is_ebg_staff())
  )
);

drop policy if exists "Staff can manage EBG forms" on public.ebg_forms;
create policy "Staff can manage EBG forms" on public.ebg_forms for all to authenticated
using (public.is_ebg_staff()) with check (public.is_ebg_staff());

drop policy if exists "Staff can manage EBG form questions" on public.ebg_form_questions;
create policy "Staff can manage EBG form questions" on public.ebg_form_questions for all to authenticated
using (public.is_ebg_staff()) with check (public.is_ebg_staff());

drop policy if exists "Staff can read EBG submissions" on public.ebg_form_submissions;
create policy "Staff can read EBG submissions" on public.ebg_form_submissions for select to authenticated
using (public.is_ebg_staff());

drop policy if exists "Staff can update EBG submissions" on public.ebg_form_submissions;
create policy "Staff can update EBG submissions" on public.ebg_form_submissions for update to authenticated
using (public.is_ebg_staff()) with check (public.is_ebg_staff());

create or replace function public.submit_ebg_form(
  p_form_id uuid,
  p_answers jsonb,
  p_respondent_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_form public.ebg_forms;
  v_question public.ebg_form_questions;
  v_value text;
  v_id uuid;
begin
  select * into v_form from public.ebg_forms where id = p_form_id;
  if v_form.id is null then raise exception 'Form not found.'; end if;
  if v_form.status <> 'open' then raise exception 'This form is not accepting responses.'; end if;
  if jsonb_typeof(p_answers) <> 'object' then raise exception 'Invalid response payload.'; end if;

  for v_question in
    select * from public.ebg_form_questions where form_id = p_form_id order by position asc
  loop
    v_value := coalesce(p_answers ->> v_question.key, '');
    if v_question.required and char_length(trim(v_value)) = 0 then
      raise exception 'Please complete: %', v_question.label;
    end if;
    if v_question.type = 'email' and char_length(trim(v_value)) > 0 and position('@' in v_value) = 0 then
      raise exception 'Please enter a valid email address.';
    end if;
  end loop;

  insert into public.ebg_form_submissions (form_id, respondent_email, answers)
  values (p_form_id, nullif(lower(trim(coalesce(p_respondent_email, ''))), ''), p_answers)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.submit_ebg_form(uuid, jsonb, text) from public;
grant execute on function public.submit_ebg_form(uuid, jsonb, text) to anon, authenticated;

grant select on public.ebg_forms, public.ebg_form_questions to anon, authenticated;
grant select, update on public.ebg_form_submissions to authenticated;
grant insert, update, delete on public.ebg_forms, public.ebg_form_questions to authenticated;

-- Seed the first v2 form from the legacy Heartspell application.
insert into public.ebg_forms (slug, title, eyebrow, description, status, submit_message)
values (
  'heartspell-house',
  'Heartspell House Casting',
  'EBG CASTING',
  'Apply to enter Heartspell House. Tell us who you are, where you are, and what kind of connection you are looking for.',
  'open',
  'Application received. EBG casting will contact selected applicants. ✨'
)
on conflict (slug) do update set
  title = excluded.title,
  eyebrow = excluded.eyebrow,
  description = excluded.description,
  status = excluded.status,
  submit_message = excluded.submit_message,
  updated_at = now();

with f as (select id from public.ebg_forms where slug = 'heartspell-house')
insert into public.ebg_form_questions (form_id, label, key, type, required, position, placeholder)
select f.id, q.label, q.key, q.type, true, q.position, q.placeholder
from f
cross join (values
  ('Name','legalName','text',1,'Your name'),
  ('Age','age','number',2,'21+'),
  ('City / State','cityState','text',3,'Atlanta, GA'),
  ('Email','email','email',4,'you@example.com'),
  ('What are you looking for?','relationshipGoals','textarea',5,'Tell us what you want from the experience.'),
  ('Tell us about your comfort being filmed.','cameraComfort','textarea',6,'Tell us how you feel about being on camera.')
) as q(label,key,type,position,placeholder)
on conflict (form_id, key) do update set
  label = excluded.label,
  type = excluded.type,
  position = excluded.position,
  placeholder = excluded.placeholder;
