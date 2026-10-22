-- Account handles are unique, while display names can be changed and reused.
alter table public.accounts add column if not exists username text;
alter table public.accounts add column if not exists display_name text;

update public.accounts a
set username = 'user_' || left(replace(a.id::text, '-', ''), 16)
where a.username is null;

update public.accounts a
set display_name = coalesce(
  (select nullif(trim(i.display_name), '') from public.studio_identities i where i.account_id = a.id limit 1),
  (select nullif(trim(p.name), '') from public.profiles p where p.account_id = a.id order by p.created_at limit 1),
  'EBG+ Member'
)
where a.display_name is null;

alter table public.accounts alter column username set not null;
alter table public.accounts alter column display_name set not null;
alter table public.accounts add constraint account_username_format check (username ~ '^[a-z][a-z0-9_]{2,23}$');
alter table public.accounts add constraint account_display_name_length check (char_length(trim(display_name)) between 1 and 80);
create unique index if not exists accounts_username_unique on public.accounts (lower(username));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_account_type text;
  v_display_name text;
  v_company_name text;
  v_username text;
begin
  v_account_type := lower(coalesce(new.raw_user_meta_data->>'account_type','viewer'));
  if v_account_type not in ('viewer','creator','producer') then v_account_type := 'viewer'; end if;

  v_display_name := left(trim(coalesce(new.raw_user_meta_data->>'display_name','')),80);
  if v_display_name = '' then v_display_name := left(coalesce(nullif(split_part(new.email,'@',1),''),'Main Profile'),80); end if;
  v_company_name := nullif(trim(coalesce(new.raw_user_meta_data->>'company_name','')),'');
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username','')));
  if v_username = '' then v_username := 'user_' || left(replace(new.id::text, '-', ''),16); end if;
  if v_username !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Choose a username with 3–24 letters, numbers, or underscores, starting with a letter.'; end if;

  insert into public.accounts (id,email,role,account_type,username,display_name)
  values (new.id,new.email,'viewer',v_account_type,v_username,v_display_name)
  on conflict (id) do update set email=excluded.email,account_type=excluded.account_type;

  insert into public.profiles (account_id,name,avatar)
  values (new.id,left(v_display_name,40),'✨') on conflict do nothing;

  if v_account_type in ('creator','producer') then
    insert into public.studio_identities(account_id,identity_type,display_name,company_name,verified,badge_tone)
    values (new.id,v_account_type,v_display_name,left(v_company_name,100),false,
      case when v_account_type='producer' then 'violet' else 'blue' end)
    on conflict (account_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_username ~ '^[a-z][a-z0-9_]{2,23}$'
    and not exists (select 1 from public.accounts where lower(username) = lower(p_username));
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon,authenticated;

create or replace function public.set_public_identity(p_username text, p_display_name text)
returns table(username text, display_name text)
language plpgsql security definer set search_path = ''
as $$
declare
  v_username text := lower(trim(p_username));
  v_display_name text := trim(p_display_name);
begin
  if auth.uid() is null then raise exception 'Sign in to edit your identity.'; end if;
  if v_username !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Username must be 3–24 letters, numbers, or underscores and start with a letter.'; end if;
  if char_length(v_display_name) not between 1 and 80 then raise exception 'Display name must be 1–80 characters.'; end if;
  if exists (select 1 from public.accounts a where lower(a.username)=v_username and a.id<>auth.uid()) then
    raise exception 'That username is taken.';
  end if;

  update public.accounts a set username=v_username,display_name=v_display_name where a.id=auth.uid();
  if not found then raise exception 'Account not found.'; end if;
  update public.studio_identities i set display_name=v_display_name,updated_at=now() where i.account_id=auth.uid();
  return query select a.username,a.display_name from public.accounts a where a.id=auth.uid();
exception when unique_violation then
  raise exception 'That username is taken.';
end;
$$;
revoke all on function public.set_public_identity(text,text) from public;
revoke all on function public.set_public_identity(text,text) from anon;
grant execute on function public.set_public_identity(text,text) to authenticated;
