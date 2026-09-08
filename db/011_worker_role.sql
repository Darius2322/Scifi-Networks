-- ============================================================================
-- SciFi Networks — 011: worker role + task assignment system
-- ============================================================================

-- Separate from 'technician' — workers handle assigned tasks that aren't
-- necessarily tied to a specific ticket or installation (general fieldwork,
-- site upkeep, etc.), tracked through the new staff_tasks table below.
alter type app_role add value if not exists 'worker';
