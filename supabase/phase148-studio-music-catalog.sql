-- EBG Studio music catalog persistence fix
-- Preserves the existing show-scoped CMS merge logic while allowing Music Studio
-- to persist the top-level `music` catalog for staff accounts.

begin;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'studio_save_cms'
      and pg_get_function_identity_arguments(p.oid) = 'p_value jsonb'
  ) and not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'studio_save_cms_scoped_legacy'
      and pg_get_function_identity_arguments(p.oid) = 'p_value jsonb'
  ) then
    alter function public.studio_save_cms(jsonb) rename to studio_save_cms_scoped_legacy;
  end if;
end
$$;

create or replace function public.studio_save_cms(p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_music jsonb;
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_staff() then
    raise exception 'Studio staff access required.';
  end if;

  -- Music Studio is a global catalog, not a show-scoped object. Persist it
  -- before handing the rest of the CMS payload to the existing scoped merge.
  if p_value ? 'music' then
    v_music := coalesce(p_value->'music', '{}'::jsonb);

    insert into public.cms_settings (key, value, updated_at)
    values ('cms', jsonb_build_object('music', v_music), now())
    on conflict (key) do update
      set value = jsonb_set(
        coalesce(public.cms_settings.value, '{}'::jsonb),
        '{music}',
        v_music,
        true
      ),
      updated_at = now();
  end if;

  if to_regprocedure('public.studio_save_cms_scoped_legacy(jsonb)') is null then
    raise exception 'Legacy scoped Studio CMS save function is missing.';
  end if;

  select public.studio_save_cms_scoped_legacy(p_value) into v_result;
  return v_result;
end;
$$;

grant execute on function public.studio_save_cms(jsonb) to authenticated;

notify pgrst, 'reload schema';

commit;
