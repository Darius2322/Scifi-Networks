import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { InstallationManager } from '@/components/admin/installation-manager';

export default async function AdminInstallationsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: installations }, { data: technicians }] = await Promise.all([
    supabase
      .from('installations')
      .select('id, ticket_number, status, created_at, scheduled_at, sites(name), customers(full_name, phone), packages(name), assigned_technician_id')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('app_users').select('id, full_name, site_id').eq('role', 'technician').eq('is_active', true),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Installations</h1>
      <div className="mt-6">
        <InstallationManager initialInstallations={installations ?? []} technicians={technicians ?? []} />
      </div>
    </AdminShell>
  );
}
