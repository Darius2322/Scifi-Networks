import { redirect } from 'next/navigation';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { getStaffDashboardData } from '@/lib/data/staff';
import { StaffShell } from '@/components/staff/staff-shell';

export default async function StaffDashboardPage() {
  const session = await getAppUserSession();

  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const { installations, openTickets, outages, lowStockItems } = await getStaffDashboardData(session.site_id);

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Dashboard</h1>

      {outages.length > 0 && (
        <div className="mt-5 border border-status-warn/40 bg-status-warn/5 p-4">
          <p className="text-sm font-medium text-status-warn">Active network outages</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-800">
            {outages.map((o: any) => (
              <li key={o.id}>{o.title} — {o.status.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <Panel title="New installation requests" count={installations.length}>
          {installations.length === 0 ? (
            <EmptyState text="No pending installations." />
          ) : (
            <ul className="divide-y divide-ink-950/10">
              {installations.map((i: any) => {
                const customer = Array.isArray(i.customers) ? i.customers[0] : i.customers;
                return (
                  <li key={i.id} className="py-2.5 text-sm">
                    <p className="font-medium text-ink-950">{customer?.full_name ?? 'Unknown customer'}</p>
                    <p className="text-ink-800/60">{i.ticket_number} · {i.status.replace('_', ' ')}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Open tickets" count={openTickets.length}>
          {openTickets.length === 0 ? (
            <EmptyState text="No open tickets." />
          ) : (
            <ul className="divide-y divide-ink-950/10">
              {openTickets.map((t: any) => (
                <li key={t.id} className="py-2.5 text-sm">
                  <p className="font-medium text-ink-950">{t.subject}</p>
                  <p className="text-ink-800/60">
                    {t.ticket_number} · {t.priority} · {t.status.replace('_', ' ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Inventory alerts" count={lowStockItems.length}>
          {lowStockItems.length === 0 ? (
            <EmptyState text="Stock levels are healthy." />
          ) : (
            <ul className="divide-y divide-ink-950/10">
              {lowStockItems.map((item) => (
                <li key={item.id} className="py-2.5 text-sm">
                  <p className="font-medium text-ink-950">{item.name}</p>
                  <p className="text-status-warn">
                    {item.current_stock} {item.unit} remaining (min {item.minimum_stock})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </StaffShell>
  );
}

function Panel({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="border border-ink-950/10 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-950">{title}</h2>
        <span className="text-xs text-ink-800/50">{count}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-ink-800/60">{text}</p>;
}
