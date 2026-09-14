import { redirect } from 'next/navigation';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { StaffShell } from '@/components/staff/staff-shell';
import { StaffTaskList } from '@/components/staff/staff-task-list';

export default async function StaffTasksPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const supabase = createServerSupabase();
  const { data: tasks } = await supabase
    .from('staff_tasks')
    .select('id, title, description, status, created_at, completed_at, sites(name)')
    .eq('assigned_to', session.id)
    .order('created_at', { ascending: false });

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">My Tasks</h1>
      <div className="mt-6">
        <StaffTaskList initialTasks={tasks ?? []} />
      </div>
    </StaffShell>
  );
}
