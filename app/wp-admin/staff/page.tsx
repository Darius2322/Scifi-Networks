import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { StaffManager } from '@/components/admin/staff-manager';

export default async function AdminStaffPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServerSupabase();
  const [{ data: staff }, { data: sites }] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, full_name, username, email, role, site_id, is_active, last_login_at, sites(name)')
      .not('role', 'in', '(agent,customer)')
      .order('full_name'),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Staff</h1>
      <div className="mt-6">
        <StaffManager initialStaff={staff ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
