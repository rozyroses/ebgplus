-- Phase 1.62 — allow users/staff to permanently delete visible application submissions
-- Existing application messages cascade automatically when their submission is deleted.
-- Notifications created with a submission_id also cascade through the Phase 1.61 foreign key.

drop policy if exists "Applicants can delete their EBG submissions" on public.ebg_form_submissions;
create policy "Applicants can delete their EBG submissions"
on public.ebg_form_submissions for delete to authenticated
using (
  submitted_by = auth.uid()
  or lower(coalesce(respondent_email,'')) = lower(coalesce((select email from public.accounts where id = auth.uid()),''))
  or public.is_ebg_staff()
);

grant delete on public.ebg_form_submissions to authenticated;
