import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { TaskManager } from '@/components/admin/task-manager';

export default async function AdminTasksPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: tasks }, { data: staff }, { data: sites }] = await Promise.all([
    supabase.from('staff_tasks').select('*, app_users!staff_tasks_assigned_to_fkey(full_name), sites(name)').order('created_at', { ascending: false }).limit(100),
    supabase.from('app_users').select('id, full_name, role').not('role', 'in', '(agent,customer,owner,admin)').eq('is_active', true),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Tasks</h1>
      <div className="mt-6">
        <TaskManager initialTasks={tasks ?? []} staff={staff ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
