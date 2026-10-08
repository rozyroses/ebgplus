begin;
set constraints sync_studio_project_music immediate;
do $$ declare actor uuid; begin
 select owner_account_id into actor from public.studio_projects order by created_at limit 1;
 if actor is null then raise exception 'A Studio project is required'; end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
end $$;
set local role authenticated;
do $$ declare p public.studio_projects%rowtype; original jsonb; edited jsonb; release jsonb; track jsonb; projected jsonb; state text; released boolean; public_id text; other_before jsonb; other_after jsonb;
begin
 select * into p from public.studio_projects where owner_account_id=auth.uid() order by created_at limit 1;
 original:=p.cms;
 select value->'music' into projected from public.cms_settings where key='cms';
 select coalesce(jsonb_agg(e),'[]') into other_before from jsonb_array_elements(coalesce(projected->'releases','[]')) e where e->>'sourceProjectId' is distinct from p.id::text;
 release:=jsonb_build_object('id','qa-rollback-release','artistId',original#>>'{music,artists,0,id}','title','QA rollback release','type','single','publishStatus','draft','releaseDate','2099-01-01T00:00:00Z','internalNotes','must remain private');
 track:=jsonb_build_object('id','qa-rollback-track','releaseId','qa-rollback-release','artistId',release->>'artistId','title','QA rollback track','audioUrl',original#>>'{music,tracks,0,audioUrl}');
 if track->>'audioUrl' is null or release->>'artistId' is null then raise exception 'Existing audio and artist required'; end if;
 edited:=jsonb_set(original,'{music,releases}',coalesce(original#>'{music,releases}','[]')||jsonb_build_array(release));
 edited:=jsonb_set(edited,'{music,tracks}',coalesce(original#>'{music,tracks}','[]')||jsonb_build_array(track));
 public_id:='project-'||p.id::text||'-qa-rollback-release';
 foreach state in array array['draft','scheduled','live','archived'] loop
  select jsonb_agg(case when e->>'id'='qa-rollback-release' then jsonb_set(e,'{publishStatus}',to_jsonb(state)) else e end) into projected from jsonb_array_elements(edited#>'{music,releases}') e;
  edited:=jsonb_set(edited,'{music,releases}',projected);
  update public.studio_projects set cms=edited where id=p.id;
  if not found then raise exception 'Owner save failed'; end if;
  select value->'music' into projected from public.cms_settings where key='cms';
  released:=exists(select 1 from jsonb_array_elements(projected->'releases') e where e->>'id'=public_id);
  if released is distinct from (state in ('scheduled','live')) then raise exception 'Projection incorrect for %',state; end if;
  if exists(select 1 from jsonb_array_elements(projected->'releases') e where e->>'id'=public_id and e ? 'internalNotes') then raise exception 'Private release notes leaked'; end if;
  select coalesce(jsonb_agg(e),'[]') into other_after from jsonb_array_elements(projected->'releases') e where e->>'sourceProjectId' is distinct from p.id::text;
  if other_after is distinct from other_before then raise exception 'Other productions changed'; end if;
 end loop;
end $$;
select 'Draft, scheduled, live, archive, owner save, private notes, and production isolation passed' as verification;
rollback;
