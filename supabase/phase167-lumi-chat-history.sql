-- Persistent Lumi chat history scoped to the signed-in account and private Studio project.

create table if not exists public.lumi_chats (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references public.accounts(id) on delete cascade default auth.uid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  title text not null default 'New chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lumi_chats_owner_project_updated_idx
on public.lumi_chats(owner_account_id, project_id, updated_at desc);

alter table public.lumi_chats enable row level security;

drop policy if exists "Lumi chats are private to their owner" on public.lumi_chats;
create policy "Lumi chats are private to their owner"
on public.lumi_chats
for all
to authenticated
using (
  owner_account_id = auth.uid()
  and exists (
    select 1
    from public.studio_projects p
    where p.id = project_id
      and p.owner_account_id = auth.uid()
  )
)
with check (
  owner_account_id = auth.uid()
  and exists (
    select 1
    from public.studio_projects p
    where p.id = project_id
      and p.owner_account_id = auth.uid()
  )
);

grant select, insert, update, delete on public.lumi_chats to authenticated;
