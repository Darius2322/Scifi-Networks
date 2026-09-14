import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { PaymentsManager } from '@/components/admin/payments-manager';
import { RevenueChart } from '@/components/admin/revenue-chart';

export default async function AdminPaymentsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: payments }, { data: customers }] = await Promise.all([
    supabase.from('payments').select('id, amount_kes, method, status, reference, created_at, customers(full_name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('customers').select('id, full_name').order('full_name').limit(500),
  ]);

  // Build a simple last-30-days revenue series from real payment rows.
  const days: { date: string; total: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const total = (payments ?? [])
      .filter((p) => p.created_at.slice(0, 10) === key && p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount_kes), 0);
    days.push({ date: key, total });
  }

  const totalRevenue = (payments ?? []).filter((p) => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount_kes), 0);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Payments & Revenue</h1>

      <div className="mt-6 border border-ink-950/10 p-5">
        <p className="text-sm text-ink-800/60">Total recorded revenue</p>
        <p className="mt-1 font-display text-3xl font-semibold text-ink-950">KES {totalRevenue.toLocaleString()}</p>
        <div className="mt-4">
          <RevenueChart data={days} />
        </div>
      </div>

      <div className="mt-8">
        <PaymentsManager initialPayments={payments ?? []} customers={customers ?? []} />
      </div>
    </AdminShell>
  );
}
