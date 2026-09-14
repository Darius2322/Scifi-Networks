import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminAnalyticsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const [{ data: installations }, { data: txns }, { data: tickets }] = await Promise.all([
    supabase.from('installations').select('package_id, packages(name)'),
    supabase.from('inventory_transactions').select('item_id, quantity, action, inventory_items(name)').in('action', ['issue', 'remove']),
    supabase.from('tickets').select('type'),
  ]);

  const packageCounts = new Map<string, { name: string; count: number }>();
  for (const inst of installations ?? []) {
    if (!inst.package_id) continue;
    const pkg = Array.isArray(inst.packages) ? inst.packages[0] : inst.packages;
    const name = pkg?.name ?? 'Unknown';
    const existing = packageCounts.get(inst.package_id) ?? { name, count: 0 };
    existing.count += 1;
    packageCounts.set(inst.package_id, existing);
  }
  const topPackages = [...packageCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  const itemUsage = new Map<string, { name: string; total: number }>();
  for (const t of txns ?? []) {
    const item = Array.isArray(t.inventory_items) ? t.inventory_items[0] : t.inventory_items;
    const name = item?.name ?? 'Unknown';
    const existing = itemUsage.get(t.item_id) ?? { name, total: 0 };
    existing.total += Number(t.quantity);
    itemUsage.set(t.item_id, existing);
  }
  const topItems = [...itemUsage.values()].sort((a, b) => b.total - a.total).slice(0, 8);

  const ticketTypeCounts = new Map<string, number>();
  for (const t of tickets ?? []) {
    ticketTypeCounts.set(t.type, (ticketTypeCounts.get(t.type) ?? 0) + 1);
  }
  const topTicketTypes = [...ticketTypeCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Analytics</h1>
      <p className="mt-2 text-sm text-ink-800/70">What customers are asking for, and what's actually being used.</p>

      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <Panel title="Most requested packages">
          {topPackages.length === 0 ? (
            <Empty />
          ) : (
            <BarList items={topPackages.map((p) => ({ label: p.name, value: p.count }))} />
          )}
        </Panel>

        <Panel title="Most used inventory items">
          {topItems.length === 0 ? (
            <Empty />
          ) : (
            <BarList items={topItems.map((i) => ({ label: i.name, value: i.total }))} />
          )}
        </Panel>

        <Panel title="Ticket types">
          {topTicketTypes.length === 0 ? (
            <Empty />
          ) : (
            <BarList items={topTicketTypes.map(([type, count]) => ({ label: type.replace('_', ' '), value: count }))} />
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-ink-950/10 p-5">
      <h2 className="text-sm font-medium text-ink-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-ink-800/60">No data yet.</p>;
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="capitalize text-ink-950">{item.label}</span>
            <span className="text-ink-800/60">{item.value}</span>
          </div>
          <div className="mt-1 h-1.5 bg-ink-950/5">
            <div className="h-full bg-signal-500" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
