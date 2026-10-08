-- Launch access, applicant privacy, and read receipts.
create or replace function public.studio_can_edit_show(p_show_id text) returns boolean
language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and (public.studio_is_global() or exists(select 1 from public.studio_show_access where show_id=p_show_id and account_id=auth.uid() and access_role in ('owner','producer','editor')));
$$;
revoke all on function public.studio_can_edit_show(text) from public,anon;
grant execute on function public.studio_can_edit_show(text) to authenticated;
CREATE OR REPLACE FUNCTION public.studio_load_cms()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_value jsonb;
  v_result jsonb;
begin
  if auth.uid() is null or not (public.is_staff() or public.can_use_private_studio()) then
    raise exception 'Studio staff access required.';
  end if;

  select value into v_value
  from public.cms_settings
  where key = 'cms';

  if v_value is null then
    return null;
  end if;

  if public.studio_is_global() then
    return v_value;
  end if;

  v_result := v_value;

  v_result := jsonb_set(
    v_result,
    '{shows}',
    coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(
        coalesce(v_value->'shows', '[]'::jsonb)
      ) item
      where public.studio_can_edit_show(item->>'id')
    ), '[]'::jsonb),
    true
  );

  v_result := jsonb_set(
    v_result,
    '{episodes}',
    coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(
        coalesce(v_value->'episodes', '[]'::jsonb)
      ) item
      where public.studio_can_edit_show(item->>'showId')
    ), '[]'::jsonb),
    true
  );

  v_result := jsonb_set(
    v_result,
    '{comingSoon}',
    coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(
        coalesce(v_value->'comingSoon', '[]'::jsonb)
      ) item
      where public.studio_can_edit_show(
        trim(both '"' from item::text)
      )
    ), '[]'::jsonb),
    true
  );

  if not public.studio_can_edit_show(
    coalesce(v_value->>'heroShowId', '')
  ) then
    v_result := jsonb_set(
      v_result,
      '{heroShowId}',
      '""'::jsonb,
      true
    );
  end if;

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.studio_save_cms_scoped_legacy(p_value jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_current jsonb;
  v_merged jsonb;
  v_incoming_shows jsonb :=
    coalesce(p_value->'shows', '[]'::jsonb);
  v_incoming_episodes jsonb :=
    coalesce(p_value->'episodes', '[]'::jsonb);
  v_new_show_id text;
begin
  if auth.uid() is null or not (public.is_staff() or public.can_use_private_studio()) then
    raise exception 'Studio staff access required.';
  end if;

  select value into v_current
  from public.cms_settings
  where key = 'cms'
  for update;

  if public.studio_is_global() then
    insert into public.cms_settings (
      key,
      value,
      updated_at
    )
    values (
      'cms',
      p_value,
      now()
    )
    on conflict (key)
    do update
      set value = excluded.value,
          updated_at = excluded.updated_at;

    return p_value;
  end if;

  v_current := coalesce(v_current, '{}'::jsonb);


  -- A scoped creator may edit only existing shows
  -- already assigned to them.

  if exists (
    select 1
    from jsonb_array_elements(v_incoming_shows) incoming
    where exists (
      select 1
      from jsonb_array_elements(
        coalesce(v_current->'shows', '[]'::jsonb)
      ) existing
      where existing->>'id' = incoming->>'id'
    )
    and not public.studio_can_edit_show(
      incoming->>'id'
    )
  ) then
    raise exception
      'You do not have access to one or more submitted shows.';
  end if;


  -- New shows automatically belong to their creator.

  for v_new_show_id in
    select incoming->>'id'
    from jsonb_array_elements(v_incoming_shows) incoming
    where nullif(incoming->>'id', '') is not null
      and not exists (
        select 1
        from jsonb_array_elements(
          coalesce(v_current->'shows', '[]'::jsonb)
        ) existing
        where existing->>'id' = incoming->>'id'
      )
  loop
    insert into public.studio_show_access (
      show_id,
      account_id,
      access_role,
      granted_by
    )
    values (
      v_new_show_id,
      auth.uid(),
      'owner',
      auth.uid()
    )
    on conflict (show_id, account_id)
    do update
      set access_role = 'owner';
  end loop;


  -- Preserve inaccessible productions,
  -- replace only the creator's visible shows.

  v_merged := jsonb_set(
    v_current,
    '{shows}',
    coalesce((
      select jsonb_agg(item)
      from (
        select existing as item
        from jsonb_array_elements(
          coalesce(v_current->'shows', '[]'::jsonb)
        ) existing
        where not public.studio_can_edit_show(
          existing->>'id'
        )

        union all

        select incoming as item
        from jsonb_array_elements(
          v_incoming_shows
        ) incoming
      ) merged_shows
    ), '[]'::jsonb),
    true
  );


  -- Preserve other productions' episodes too.

  v_merged := jsonb_set(
    v_merged,
    '{episodes}',
    coalesce((
      select jsonb_agg(item)
      from (
        select existing as item
        from jsonb_array_elements(
          coalesce(v_current->'episodes', '[]'::jsonb)
        ) existing
        where not public.studio_can_edit_show(
          existing->>'showId'
        )

        union all

        select incoming as item
        from jsonb_array_elements(
          v_incoming_episodes
        ) incoming
        where public.studio_can_edit_show(
          incoming->>'showId'
        )
      ) merged_episodes
    ), '[]'::jsonb),
    true
  );


  -- Global homepage settings remain global-only.

  v_merged := jsonb_set(
    v_merged,
    '{rails}',
    coalesce(
      v_current->'rails',
      '[]'::jsonb
    ),
    true
  );

  v_merged := jsonb_set(
    v_merged,
    '{comingSoon}',
    coalesce(
      v_current->'comingSoon',
      '[]'::jsonb
    ),
    true
  );

  v_merged := jsonb_set(
    v_merged,
    '{notifications}',
    coalesce(
      v_current->'notifications',
      '[]'::jsonb
    ),
    true
  );

  v_merged := jsonb_set(
    v_merged,
    '{heroShowId}',
    coalesce(
      v_current->'heroShowId',
      '""'::jsonb
    ),
    true
  );

  if v_current ? 'slogan' then
    v_merged := jsonb_set(
      v_merged,
      '{slogan}',
      v_current->'slogan',
      true
    );
  end if;


  insert into public.cms_settings (
    key,
    value,
    updated_at
  )
  values (
    'cms',
    v_merged,
    now()
  )
  on conflict (key)
  do update
    set value = excluded.value,
        updated_at = excluded.updated_at;


  delete from public.studio_show_access access_row
  where not exists (
    select 1
    from jsonb_array_elements(
      coalesce(v_merged->'shows', '[]'::jsonb)
    ) item
    where item->>'id' = access_row.show_id
  );

  return public.studio_load_cms();
end;
$function$;

create or replace function public.studio_save_cms(p_value jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not (public.is_staff() or public.can_use_private_studio()) then raise exception 'Studio access required'; end if;
 return public.studio_save_cms_scoped_legacy(p_value);
end $$;
revoke all on function public.studio_load_cms(), public.studio_save_cms(jsonb),public.studio_save_cms_scoped_legacy(jsonb) from public,anon;
grant execute on function public.studio_load_cms(),public.studio_save_cms(jsonb),public.studio_save_cms_scoped_legacy(jsonb) to authenticated;
drop policy if exists "Applicants can read their EBG submissions" on public.ebg_form_submissions;
create or replace function public.load_my_form_submissions() returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(to_jsonb(s)-'internal_notes' order by s.created_at desc),'[]'::jsonb)
 from public.ebg_form_submissions s
 where auth.uid() is not null and (s.submitted_by=auth.uid() or lower(s.respondent_email)=lower((select email from public.accounts where id=auth.uid())));
$$;
create or replace function public.delete_my_form_submission(p_submission_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign-in required'; end if;
 delete from public.ebg_form_submissions where id=p_submission_id and (submitted_by=auth.uid() or lower(respondent_email)=lower((select email from public.accounts where id=auth.uid())));
 if not found then raise exception 'Submission not found'; end if;
end $$;
create or replace function public.mark_application_thread_read(p_submission_id uuid,p_side text default 'staff') returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign-in required'; end if;
 if p_side='staff' then
   if not public.is_ebg_staff() then raise exception 'Staff access required'; end if;
   update public.ebg_application_messages set read_by_staff=true where submission_id=p_submission_id;
 elsif p_side='applicant' then
   if not exists(select 1 from public.ebg_form_submissions where id=p_submission_id and (submitted_by=auth.uid() or lower(respondent_email)=lower((select email from public.accounts where id=auth.uid())))) then raise exception 'Submission access required'; end if;
   update public.ebg_application_messages set read_by_applicant=true where submission_id=p_submission_id and sender_account_id<>auth.uid();
 else raise exception 'Invalid read side'; end if;
end $$;
revoke all on function public.load_my_form_submissions(),public.delete_my_form_submission(uuid),public.mark_application_thread_read(uuid,text) from public,anon;
grant execute on function public.load_my_form_submissions(),public.delete_my_form_submission(uuid),public.mark_application_thread_read(uuid,text) to authenticated;
create or replace function public.protect_studio_identity_labels() returns trigger language plpgsql set search_path=public as $$
begin
 if current_user in ('postgres','service_role','supabase_admin') then return new; end if;
 if tg_op='INSERT' then
   if not public.studio_is_global() and (new.verified or new.identity_type='founder' or new.badge_tone not in ('blue','violet')) then raise exception 'Identity labels require staff approval'; end if;
 elsif not public.studio_is_global() and (new.verified is distinct from old.verified or new.identity_type is distinct from old.identity_type or new.badge_tone is distinct from old.badge_tone) then
   raise exception 'Identity labels require staff approval';
 end if;
 return new;
end $$;
revoke all on function public.protect_studio_identity_labels() from public,anon,authenticated;
drop trigger if exists protect_studio_identity_labels on public.studio_identities;
create trigger protect_studio_identity_labels before insert or update on public.studio_identities for each row execute function public.protect_studio_identity_labels();
-- Public downloads from the existing bucket remain available, but listing is restricted.
drop policy if exists "ebg media public read" on storage.objects;
create policy "ebg media owner read" on storage.objects for select to authenticated using(bucket_id='ebg-media' and (public.is_staff() or public.can_write_studio_media(name) or ((storage.foldername(name))[1]='profiles' and (storage.foldername(name))[2]=auth.uid()::text)));
notify pgrst,'reload schema';
