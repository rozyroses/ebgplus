-- EBG+ private Studio project media ownership
-- Creator/producer accounts may write only beneath studio/<account>/<project>/...

create or replace function public.can_write_studio_media(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select
    (storage.foldername(object_name))[1] = 'studio'
    and (storage.foldername(object_name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.studio_projects sp
      where sp.id::text = (storage.foldername(object_name))[3]
        and sp.owner_account_id = auth.uid()
    );
$$;

revoke all on function public.can_write_studio_media(text) from public;
grant execute on function public.can_write_studio_media(text) to authenticated;

drop policy if exists "ebg media studio owner insert" on storage.objects;
create policy "ebg media studio owner insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ebg-media'
  and public.can_write_studio_media(name)
);

drop policy if exists "ebg media studio owner update" on storage.objects;
create policy "ebg media studio owner update"
on storage.objects for update to authenticated
using (
  bucket_id = 'ebg-media'
  and public.can_write_studio_media(name)
)
with check (
  bucket_id = 'ebg-media'
  and public.can_write_studio_media(name)
);

drop policy if exists "ebg media studio owner delete" on storage.objects;
create policy "ebg media studio owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'ebg-media'
  and public.can_write_studio_media(name)
);
