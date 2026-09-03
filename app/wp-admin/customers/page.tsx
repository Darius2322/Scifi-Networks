import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { CustomerSearch } from '@/components/admin/customer-search';

export default async function AdminCustomersPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, estate_area, is_agent, is_suspended, created_at, sites(name)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Customers</h1>
      <div className="mt-6">
        <CustomerSearch initialCustomers={customers ?? []} />
      </div>
    </AdminShell>
  );
}
