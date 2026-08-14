-- EBG+ Phase 1.13 — viewer My Applications
-- Run once in Supabase SQL Editor.

create or replace function public.get_my_casting_applications()
returns table (
  id uuid,
  show_id text,
  legal_name text,
  status text,
  source text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ca.id,
    ca.show_id,
    ca.legal_name,
    ca.status,
    ca.source,
    ca.created_at
  from public.casting_applications ca
  where auth.uid() is not null
    and (
      ca.submitted_by = auth.uid()
      or lower(ca.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  order by ca.created_at desc;
$$;

revoke all on function public.get_my_casting_applications() from public;
grant execute on function public.get_my_casting_applications() to authenticated;
