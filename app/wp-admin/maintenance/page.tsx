import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { MaintenanceManager } from '@/components/admin/maintenance-manager';

export default async function AdminMaintenancePage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: notices }, { data: sites }] = await Promise.all([
    supabase.from('maintenance_notices').select('*, sites(name)').order('starts_at', { ascending: false }),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Maintenance Notices</h1>
      <div className="mt-6">
        <MaintenanceManager initialNotices={notices ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
