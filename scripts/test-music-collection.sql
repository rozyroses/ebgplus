-- Run against the configured database. Every test write rolls back.
begin;
do $$
declare
  actor uuid;
  other uuid;
  value jsonb;
  blocked boolean := false;
begin
  select id into actor from public.accounts order by created_at limit 1;
  if actor is null then raise exception 'An existing account is required for this rollback-only test.'; end if;
  select id into other from public.accounts where id<>actor limit 1;
  other := coalesce(other,gen_random_uuid());
  perform set_config('request.jwt.claim.sub',actor::text,true);
  set local role authenticated;
  perform public.music_collection_mutate('album','__collection_qa_album','save');
  perform public.music_collection_mutate('album','__collection_qa_album','save');
  assert (select count(*) from public.music_collection_items where kind='album' and item_id='__collection_qa_album')=1, 'Album saves must be idempotent';
  perform public.music_collection_mutate('playlist','__collection_qa_tape','create','{"title":"QA tape","tone":"rose"}');
  perform public.music_collection_mutate('playlist','__collection_qa_tape','add_track','{"trackId":"one"}');
  perform public.music_collection_mutate('playlist','__collection_qa_tape','add_track','{"trackId":"two"}');
  perform public.music_collection_mutate('playlist','__collection_qa_tape','add_track','{"trackId":"two"}');
  perform public.music_collection_mutate('playlist','__collection_qa_tape','move_track','{"trackId":"two","direction":"up"}');
  select data into value from public.music_collection_items where kind='playlist' and item_id='__collection_qa_tape';
  assert value->'trackIds'='["two","one"]'::jsonb, 'Order must update atomically without duplicates';
  perform public.music_collection_mutate('playlist','__collection_qa_tape','rename','{"title":"Renamed tape","tone":"sage"}');
  perform public.music_collection_mutate('playlist','__collection_qa_tape','remove_track','{"trackId":"one"}');
  select data into value from public.music_collection_items where kind='playlist' and item_id='__collection_qa_tape';
  assert value->>'title'='Renamed tape' and value->>'tone'='sage' and value->'trackIds'='["two"]'::jsonb, 'Rename must preserve track edits';
  perform public.music_collection_mutate('favorite','import','import','{"ids":["one","two","two"]}');
  assert (select count(*) from public.music_collection_items where kind='favorite' and item_id in ('one','two'))=2, 'Favorite import must deduplicate';
  begin
    insert into public.music_collection_items(account_id,kind,item_id) values(other,'album','__collection_qa_wrong_owner');
  exception when insufficient_privilege then blocked:=true;
  end;
  assert blocked, 'RLS must reject another account owner';
  blocked:=false;
  begin
    update public.music_collection_items set account_id=other where kind='album' and item_id='__collection_qa_album';
  exception when insufficient_privilege then blocked:=true;
  end;
  assert blocked, 'RLS must reject ownership reassignment';
  perform set_config('request.jwt.claim.sub',other::text,true);
  assert (select count(*) from public.music_collection_items where item_id in ('__collection_qa_tape','__collection_qa_album'))=0, 'Collections must be private';
  perform public.music_collection_mutate('album','__collection_qa_album','remove');
  perform set_config('request.jwt.claim.sub',actor::text,true);
  assert (select count(*) from public.music_collection_items where kind='album' and item_id='__collection_qa_album')=1, 'Another account must not delete an album';
  blocked:=false;
  begin
    perform public.music_collection_mutate('playlist','__collection_qa_tape','rename','{"title":"  "}');
  exception when invalid_parameter_value then blocked:=true;
  end;
  assert blocked, 'Blank names must be rejected';
  perform public.music_collection_mutate('playlist','__collection_qa_tape','remove');
  assert (select count(*) from public.music_collection_items where kind='playlist' and item_id='__collection_qa_tape')=0, 'Playlist removal must work';
  perform set_config('request.jwt.claim.sub','',true);
  blocked:=false;
  begin
    perform public.music_collection_mutate('album','__collection_qa_album','save');
  exception when insufficient_privilege then blocked:=true;
  end;
  assert blocked, 'An expired session must not mutate collections';
  raise notice 'Album saves, playlist edits, favorites, owner isolation, validation, and expired sessions passed.';
end;
$$;
rollback;
