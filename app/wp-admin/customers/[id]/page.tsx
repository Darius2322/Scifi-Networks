import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { CustomerDetailPanel } from '@/components/admin/customer-detail-panel';

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const [{ data: customer }, { data: installations }, { data: tickets }, { data: payments }, { data: agent }] = await Promise.all([
    supabase.from('customers').select('*, sites(name)').eq('id', params.id).single(),
    supabase.from('installations').select('id, ticket_number, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('tickets').select('id, ticket_number, type, subject, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('id, amount_kes, method, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('agents').select('id, auto_issue_vouchers, voucher_duration_days').eq('customer_id', params.id).maybeSingle(),
  ]);

  if (!customer) notFound();

  let lastVoucher = null;
  if (agent) {
    const { data } = await supabase
      .from('vouchers')
      .select('id, code, status, issued_at, expires_at')
      .eq('agent_id', agent.id)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lastVoucher = data;
  }

  return (
    <AdminShell fullName={session.full_name}>
      <CustomerDetailPanel
        customer={customer}
        installations={installations ?? []}
        tickets={tickets ?? []}
        payments={payments ?? []}
        agent={agent}
        lastVoucher={lastVoucher}
      />
    </AdminShell>
  );
}
