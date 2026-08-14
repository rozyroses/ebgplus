-- EBG+ Phase 1.6 targeted storage amendment.
-- Safe to run after supabase/schema.sql. Do not rerun the full schema.

insert into storage.buckets (id, name, public, file_size_limit)
values ('ebg-media', 'ebg-media', true, 2147483648)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "ebg media public read" on storage.objects;
create policy "ebg media public read"
on storage.objects for select
using (bucket_id = 'ebg-media');

drop policy if exists "ebg media staff insert" on storage.objects;
create policy "ebg media staff insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'ebg-media' and public.is_staff());

drop policy if exists "ebg media staff update" on storage.objects;
create policy "ebg media staff update"
on storage.objects for update to authenticated
using (bucket_id = 'ebg-media' and public.is_staff())
with check (bucket_id = 'ebg-media' and public.is_staff());

drop policy if exists "ebg media staff delete" on storage.objects;
create policy "ebg media staff delete"
on storage.objects for delete to authenticated
using (bucket_id = 'ebg-media' and public.is_staff());
