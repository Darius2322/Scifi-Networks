import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { EquipmentManager } from '@/components/admin/equipment-manager';

export default async function AdminEquipmentPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: equipment }, { data: sites }] = await Promise.all([
    supabase.from('equipment').select('*, sites(name), customers:assigned_customer_id(full_name)').order('created_at', { ascending: false }),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Equipment</h1>
      <div className="mt-6">
        <EquipmentManager initialEquipment={equipment ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
