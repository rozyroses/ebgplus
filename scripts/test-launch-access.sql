begin;
do $$ declare actor uuid;
begin
 select id into actor from public.accounts where role='viewer' order by id limit 1;
 if actor is null then raise exception 'An existing viewer is required for the permission test'; end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 update public.accounts set account_type='creator' where id=actor;
 insert into public.studio_identities(account_id,identity_type,display_name,verified,badge_tone) values(actor,'creator','Permission test',false,'blue') on conflict(account_id) do nothing;
end $$;
set local role authenticated;
do $$ declare result jsonb; denied boolean:=false; original jsonb; altered jsonb;
begin
 if public.studio_is_global() then raise exception 'Test actor must not have global access'; end if;
 if exists(select 1 from public.ebg_form_submissions) then raise exception 'Applicant can read staff submission records'; end if;
 result:=public.load_my_form_submissions();
 if exists(select 1 from jsonb_array_elements(result) item where item ? 'internal_notes') then raise exception 'Internal notes exposed'; end if;
 begin update public.studio_identities set verified=not verified where account_id=auth.uid(); exception when others then denied:=true; end;
 if not denied then raise exception 'Self verification was allowed'; end if;
 denied:=false;
 begin perform public.mark_application_thread_read(gen_random_uuid(),'staff'); exception when others then denied:=true; end;
 if not denied then raise exception 'Applicant can mark staff reads'; end if;
 original:=public.studio_load_cms();
 altered:=jsonb_set(original,'{shows}',coalesce(original->'shows','[]')||jsonb_build_array(jsonb_build_object('id','launch-permission-fixture','title','Permission test','status','Coming Soon','cast','[]'::jsonb)));
 result:=public.studio_save_cms(altered);
 if not public.studio_can_edit_show('launch-permission-fixture') then raise exception 'Creator did not receive ownership'; end if;
 if not exists(select 1 from jsonb_array_elements(result->'shows') s where s->>'id'='launch-permission-fixture') then raise exception 'Creator save not readable'; end if;
 denied:=false;
 begin perform public.assert_private_media_access(jsonb_build_object('audioUrl','https://project.supabase.co/functions/v1/studio-media?path=studio%2F00000000-0000-0000-0000-000000000000%2F00000000-0000-0000-0000-000000000000%2Fa.mp3'),auth.uid(),gen_random_uuid()); exception when others then denied:=true; end;
 if not denied then raise exception 'Foreign private media was accepted'; end if;
end $$;
reset role;
do $$ begin
 update public.studio_show_access set access_role='viewer' where account_id=auth.uid() and show_id='launch-permission-fixture';
end $$;
set local role authenticated;
do $$ begin
 if public.studio_can_edit_show('launch-permission-fixture') then raise exception 'Read-only collaborator can edit'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 if exists(select 1 from storage.objects where bucket_id in ('ebg-media','ebg-studio-private')) then raise exception 'Anonymous bucket listing is allowed'; end if;
 if has_function_privilege('anon','public.load_my_form_submissions()','execute') then raise exception 'Anonymous applicant RPC access'; end if;
end $$;
rollback;
