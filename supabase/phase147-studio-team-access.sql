-- EBG Studio Phase 1.47 — Team Access RPCs
-- Run after Phase 1.46.

create or replace function public.studio_set_show_access(
  p_show_id text,
  p_account_id uuid,
  p_access_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.studio_is_global() then
    raise exception 'Global Studio access required.';
  end if;

  if p_access_role not in ('owner','producer','editor','viewer') then
    raise exception 'Invalid Studio show access role.';
  end if;

  if not exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.role in ('editor','producer','administrator','founder')
  ) then
    raise exception 'That account does not have Studio staff access.';
  end if;

  if not exists (
    select 1
    from public.cms_settings c,
         jsonb_array_elements(coalesce(c.value->'shows', '[]'::jsonb)) item
    where c.key = 'cms'
      and item->>'id' = p_show_id
  ) then
    raise exception 'Show not found.';
  end if;

  insert into public.studio_show_access (
    show_id,
    account_id,
    access_role,
    granted_by
  )
  values (
    p_show_id,
    p_account_id,
    p_access_role,
    auth.uid()
  )
  on conflict (show_id, account_id)
  do update set
    access_role = excluded.access_role,
    granted_by = auth.uid();
end;
$$;

create or replace function public.studio_remove_show_access(
  p_show_id text,
  p_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.studio_is_global() then
    raise exception 'Global Studio access required.';
  end if;

  delete from public.studio_show_access
  where show_id = p_show_id
    and account_id = p_account_id;
end;
$$;

revoke all on function public.studio_set_show_access(text, uuid, text) from public;
revoke all on function public.studio_remove_show_access(text, uuid) from public;

grant execute on function public.studio_set_show_access(text, uuid, text) to authenticated;
grant execute on function public.studio_remove_show_access(text, uuid) to authenticated;

notify pgrst, 'reload schema';
