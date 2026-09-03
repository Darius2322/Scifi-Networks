import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminInventoryManager } from '@/components/admin/admin-inventory-manager';

export default async function AdminInventoryPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: items }, { data: sites }] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('id, name, sku, category, unit, current_stock, minimum_stock, condition, sites(name)')
      .order('name'),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Inventory</h1>
      <div className="mt-6">
        <AdminInventoryManager initialItems={items ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
