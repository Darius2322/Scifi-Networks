-- ============================================================================
-- SciFi Networks — 015: storage bucket for issue/installation photos
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-attachments', 'ticket-attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Only the service role writes/reads this bucket (all uploads and downloads
-- go through server-side API routes that check authorization first, then
-- generate a short-lived signed URL — the bucket itself stays private with
-- no public/anon policies at all).
