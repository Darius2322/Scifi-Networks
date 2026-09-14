import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminAgentDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const { data: agent } = await supabase
    .from('agents')
    .select('*, sites(name), customers(full_name, phone, email, created_at)')
    .eq('id', params.id)
    .single();

  if (!agent) notFound();

  const [{ data: vouchers }, { data: tickets }, { data: auditEntries }] = await Promise.all([
    supabase.from('vouchers').select('id, code, status, issued_at, used_at, expires_at').eq('agent_id', agent.id).order('issued_at', { ascending: false }),
    supabase.from('tickets').select('id, ticket_number, subject, status, created_at').eq('agent_id', agent.id).order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('id, action, created_at, metadata').eq('entity_type', 'agent').eq('entity_id', agent.id).order('created_at', { ascending: false }),
  ]);

  const customer = Array.isArray(agent.customers) ? agent.customers[0] : agent.customers;
  const site = Array.isArray(agent.sites) ? agent.sites[0] : agent.sites;

  const availableVouchers = (vouchers ?? []).filter((v) => v.status === 'available').length;
  const usedVouchers = (vouchers ?? []).filter((v) => v.status === 'used').length;
  const reservedVouchers = (vouchers ?? []).filter((v) => v.status === 'reserved').length;
  const expiredVouchers = (vouchers ?? []).filter((v) => v.status === 'expired').length;
  const lastVoucher = (vouchers ?? [])[0];

  // Merge tickets + vouchers + audit entries into a single chronological feed.
  const timeline = [
    ...(vouchers ?? []).map((v) => ({
      at: v.issued_at,
      label: `Voucher ${v.code} issued`,
    })),
    ...(tickets ?? []).map((t) => ({
      at: t.created_at,
      label: `Reported: ${t.subject} (${t.ticket_number})`,
    })),
    ...(auditEntries ?? []).map((a) => ({
      at: a.created_at,
      label: a.action.replace(/[._]/g, ' '),
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">{customer?.full_name ?? 'Agent'}</h1>
      <p className="mt-1 text-sm text-ink-800/70">
        {customer?.phone} {customer?.email && `· ${customer.email}`} · {site?.name ?? '—'}
      </p>
      <p className="mt-1 text-xs text-ink-800/50">
        Joined {customer?.created_at ? new Date(customer.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'}
        {' · '}Status: <span className="capitalize">{agent.status}</span>
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Available vouchers" value={availableVouchers} />
        <StatCard label="Reserved" value={reservedVouchers} />
        <StatCard label="Used" value={usedVouchers} />
        <StatCard label="Expired" value={expiredVouchers} />
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="border border-ink-950/10 p-5">
          <h2 className="text-sm font-medium text-ink-950">Activity</h2>
          {timeline.length === 0 ? (
            <p className="mt-2 text-sm text-ink-800/60">No activity recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 max-h-96 overflow-y-auto">
              {timeline.map((item, i) => (
                <li key={i} className="text-sm border-b border-ink-950/5 pb-2">
                  <p className="text-ink-800 capitalize">{item.label}</p>
                  <p className="text-xs text-ink-800/50">{new Date(item.at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Responsibilities</h2>
            <ul className="mt-2 space-y-1.5">
              {(agent.responsibilities ?? []).map((r: string) => (
                <li key={r} className="text-sm text-ink-800 flex gap-2">
                  <span className="text-signal-500">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {lastVoucher && (
            <div className="border border-ink-950/10 p-5">
              <h2 className="text-sm font-medium text-ink-950">Last voucher</h2>
              <p className="mt-2 font-medium text-ink-950">{lastVoucher.code}</p>
              <p className="text-sm text-ink-800/60 capitalize">
                {lastVoucher.status} · issued {new Date(lastVoucher.issued_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink-950/10 p-4">
      <p className="font-display text-2xl font-semibold text-ink-950">{value}</p>
      <p className="mt-1 text-xs text-ink-800/60">{label}</p>
    </div>
  );
}
