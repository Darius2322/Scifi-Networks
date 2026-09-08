-- ============================================================================
-- SciFi Networks — 013: enable Realtime
--
-- Supabase only broadcasts postgres_changes for tables explicitly added to
-- the `supabase_realtime` publication. Without this, the notification bell
-- and the live voucher-list refresh will silently receive nothing — no
-- error, they just never fire.
-- ============================================================================

alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table vouchers;
