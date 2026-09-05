import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { VoucherManager } from '@/components/admin/voucher-manager';

export default async function AdminVouchersPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: vouchers }, { data: agents }] = await Promise.all([
    supabase
      .from('vouchers')
      .select('id, code, status, value_kes, issued_at, expires_at, reserved_by, reservation_expires_at, agents(customers(full_name))')
      .order('issued_at', { ascending: false })
      .limit(100),
    supabase
      .from('agents')
      .select('id, status, customers(full_name)')
      .eq('status', 'active'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Vouchers</h1>
      <div className="mt-6">
        <VoucherManager initialVouchers={vouchers ?? []} agents={agents ?? []} />
      </div>
    </AdminShell>
  );
}
