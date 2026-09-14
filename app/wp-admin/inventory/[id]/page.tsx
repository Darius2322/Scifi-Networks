import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminInventoryItemPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const { data: item } = await supabase.from('inventory_items').select('*, sites(name)').eq('id', params.id).single();
  if (!item) notFound();

  const { data: transactions } = await supabase
    .from('inventory_transactions')
    .select('id, action, quantity, balance_after, reason, notes, created_at, performed_by')
    .eq('item_id', params.id)
    .order('created_at', { ascending: false });

  const performerIds = [...new Set((transactions ?? []).map((t) => t.performed_by).filter(Boolean))] as string[];
  let names: Record<string, string> = {};
  if (performerIds.length > 0) {
    const { data: users } = await supabase.from('app_users').select('id, full_name').in('id', performerIds);
    names = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name]));
  }

  const site = Array.isArray(item.sites) ? item.sites[0] : item.sites;
  const isLow = item.current_stock <= item.minimum_stock;

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">{item.name}</h1>
      <p className="mt-1 text-sm text-ink-800/70 font-mono">{item.sku}</p>
      <p className="mt-1 text-xs text-ink-800/50">
        {site?.name ?? '—'} · {item.category} · Added {new Date(item.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg">
        <div className="border border-ink-950/10 p-4">
          <p className={`font-display text-2xl font-semibold ${isLow ? 'text-status-warn' : 'text-ink-950'}`}>
            {item.current_stock} {item.unit}
          </p>
          <p className="mt-1 text-xs text-ink-800/60">Current stock</p>
        </div>
        <div className="border border-ink-950/10 p-4">
          <p className="font-display text-2xl font-semibold text-ink-950">{item.minimum_stock}</p>
          <p className="mt-1 text-xs text-ink-800/60">Minimum level</p>
        </div>
        <div className="border border-ink-950/10 p-4">
          <p className="font-display text-2xl font-semibold text-ink-950 capitalize">{item.condition}</p>
          <p className="mt-1 text-xs text-ink-800/60">Condition</p>
        </div>
      </div>

      {item.description && <p className="mt-6 text-sm text-ink-800/80 max-w-lg">{item.description}</p>}

      <div className="mt-8 border border-ink-950/10">
        <div className="p-4 border-b border-ink-950/10">
          <h2 className="text-sm font-medium text-ink-950">Full movement history</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Quantity</th>
              <th className="p-3 font-medium">Balance after</th>
              <th className="p-3 font-medium">By</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {(transactions ?? []).map((t) => (
              <tr key={t.id}>
                <td className="p-3 capitalize text-ink-950">{t.action.replace('_', ' ')}</td>
                <td className="p-3 text-ink-800/70">{t.quantity} {item.unit}</td>
                <td className="p-3 text-ink-800/70">{t.balance_after} {item.unit}</td>
                <td className="p-3 text-ink-800/70">{t.performed_by ? names[t.performed_by] ?? 'Unknown' : 'System'}</td>
                <td className="p-3 text-ink-800/70">{t.reason ?? '—'}</td>
                <td className="p-3 text-ink-800/50 whitespace-nowrap">
                  {new Date(t.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
            {(transactions ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-800/60">
                  No movements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
