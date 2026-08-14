-- EBG+ Phase 1.7 profile photo upload policy amendment

drop policy if exists "ebg profile media insert" on storage.objects;
create policy "ebg profile media insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ebg-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "ebg profile media update" on storage.objects;
create policy "ebg profile media update"
on storage.objects for update to authenticated
using (
  bucket_id = 'ebg-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'ebg-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "ebg profile media delete" on storage.objects;
create policy "ebg profile media delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'ebg-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);
