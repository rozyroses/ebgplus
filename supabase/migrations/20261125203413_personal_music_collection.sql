-- Private account collections. Catalog references are IDs, never cached media URLs.
create table public.music_collection_items (
  account_id uuid not null default auth.uid() references public.accounts(id) on delete cascade,
  kind text not null check (kind in ('album','favorite','playlist','recent')),
  item_id text not null check (char_length(item_id) between 1 and 500),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 300000),
  updated_at timestamptz not null default now(),
  primary key (account_id, kind, item_id)
);
alter table public.music_collection_items enable row level security;
create policy "music collections belong to their account" on public.music_collection_items
  for all to authenticated
  using (account_id = (select auth.uid()))
  with check (account_id = (select auth.uid()));
revoke all on public.music_collection_items from anon;
grant select, insert, update, delete on public.music_collection_items to authenticated;

-- Apply playlist deltas under a row lock so edits from different devices compose.
create function public.music_collection_mutate(p_kind text, p_id text, p_action text, p_data jsonb default '{}'::jsonb)
returns setof public.music_collection_items
language plpgsql security invoker set search_path = '' as $$
declare
  actor uuid := auth.uid();
  value jsonb;
  ids jsonb;
  title text;
  tone text;
  track_id text;
  target integer;
  position integer;
  swap jsonb;
begin
  if actor is null then raise exception 'Sign in to use your collection.' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('album','favorite','playlist','recent')
    or p_id is null or char_length(p_id) not between 1 and 500
    or p_data is null or jsonb_typeof(p_data) <> 'object'
    or octet_length(p_data::text) > 300000 then
    raise exception 'Invalid collection item.' using errcode = '22023';
  end if;

  if p_action = 'import' and p_kind = 'favorite' then
    ids := p_data->'ids';
    if ids is null or jsonb_typeof(ids) <> 'array' or jsonb_array_length(ids) > 500 then
      raise exception 'Invalid favorite import.' using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(ids) x where jsonb_typeof(x) <> 'string' or char_length(x #>> '{}') not between 1 and 500) then
      raise exception 'Invalid favorite IDs.' using errcode = '22023';
    end if;
    insert into public.music_collection_items(account_id,kind,item_id)
      select distinct actor,'favorite',x from jsonb_array_elements_text(ids) x on conflict do nothing;
  elsif p_action = 'remove' then
    delete from public.music_collection_items where account_id=actor and kind=p_kind and item_id=p_id;
  elsif p_action = 'save' and p_kind <> 'playlist' then
    insert into public.music_collection_items(account_id,kind,item_id) values(actor,p_kind,p_id)
      on conflict (account_id,kind,item_id) do update set updated_at=clock_timestamp();
    if p_kind='recent' then
      delete from public.music_collection_items where account_id=actor and kind='recent'
        and item_id in (select item_id from public.music_collection_items where account_id=actor and kind='recent' order by updated_at desc,item_id offset 40);
    end if;
  elsif p_kind='playlist' then
    select data into value from public.music_collection_items where account_id=actor and kind='playlist' and item_id=p_id for update;
    if p_action='create' then
      title := btrim(p_data->>'title');
      tone := coalesce(p_data->>'tone','lavender');
      if title is null or char_length(title) not between 1 and 80 or tone not in ('lavender','rose','sage','blue','honey') then
        raise exception 'Give your playlist a name of 1–80 characters and choose a cassette color.' using errcode='22023';
      end if;
      insert into public.music_collection_items(account_id,kind,item_id,data)
        values(actor,'playlist',p_id,jsonb_build_object('title',title,'tone',tone,'trackIds','[]'::jsonb)) on conflict do nothing;
    else
      if value is null then raise exception 'This playlist no longer exists. Refresh your collection.' using errcode='22023'; end if;
      ids := coalesce(value->'trackIds','[]'::jsonb);
      if p_action='rename' then
        title := btrim(p_data->>'title');
        tone := coalesce(p_data->>'tone',value->>'tone','lavender');
        if title is null or char_length(title) not between 1 and 80 or tone not in ('lavender','rose','sage','blue','honey') then
          raise exception 'Give your playlist a name of 1–80 characters and choose a cassette color.' using errcode='22023';
        end if;
        value := value || jsonb_build_object('title',title,'tone',tone);
      elsif p_action in ('add_track','remove_track','move_track') then
        track_id := p_data->>'trackId';
        if track_id is null or char_length(track_id) not between 1 and 500 then raise exception 'Invalid song.' using errcode='22023'; end if;
        if p_action='add_track' then
          if not ids @> jsonb_build_array(track_id) then
            if jsonb_array_length(ids)>=500 then raise exception 'A playlist can hold up to 500 songs.' using errcode='22023'; end if;
            ids := ids || jsonb_build_array(track_id);
          end if;
        elsif p_action='remove_track' then
          select coalesce(jsonb_agg(x order by ord),'[]'::jsonb) into ids from jsonb_array_elements(ids) with ordinality a(x,ord) where x <> to_jsonb(track_id);
        else
          if p_data->>'direction' is null or p_data->>'direction' not in ('up','down') then raise exception 'Invalid song order.' using errcode='22023'; end if;
          select ord::integer-1 into position from jsonb_array_elements_text(ids) with ordinality a(x,ord) where x=track_id limit 1;
          if position is not null then
            target := position + case when p_data->>'direction'='up' then -1 else 1 end;
            if target>=0 and target<jsonb_array_length(ids) then
              swap := ids->target;
              ids := jsonb_set(jsonb_set(ids,array[target::text],to_jsonb(track_id)),array[position::text],swap);
            end if;
          end if;
        end if;
        value := value || jsonb_build_object('trackIds',ids);
      else raise exception 'Invalid playlist action.' using errcode='22023';
      end if;
      update public.music_collection_items set data=value,updated_at=clock_timestamp() where account_id=actor and kind='playlist' and item_id=p_id;
    end if;
  else raise exception 'Invalid collection action.' using errcode='22023';
  end if;
  return query select * from public.music_collection_items where account_id=actor order by updated_at desc,item_id limit 5000;
end;
$$;
revoke all on function public.music_collection_mutate(text,text,text,jsonb) from public,anon;
grant execute on function public.music_collection_mutate(text,text,text,jsonb) to authenticated;
