-- ============================================================================
-- SciFi Networks — 014: payments recording + equipment RLS completeness check
-- ============================================================================

-- Payments table already exists (001_schema.sql) with RLS from 002_rls.sql.
-- Add a recorded_by column so manual payment entries have an accountable actor.
alter table payments add column if not exists recorded_by uuid references app_users(id);

-- Equipment already has RLS policies from 002_rls.sql (equipment_read/write/update).
-- Nothing further needed there — this file exists mainly for the payments column.
