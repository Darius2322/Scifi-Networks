import { redirect } from 'next/navigation';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { StaffShell } from '@/components/staff/staff-shell';
import { InventoryManager } from '@/components/staff/inventory-manager';

export default async function StaffInventoryPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const supabase = createServerSupabase();
  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, sku, category, unit, current_stock, minimum_stock, condition')
    .order('name');

  const canManageStock = ['owner', 'admin', 'site_manager', 'inventory_staff'].includes(session.role);

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Inventory</h1>
      <div className="mt-6">
        <InventoryManager initialItems={items ?? []} canManageStock={canManageStock} siteId={session.site_id} />
      </div>
    </StaffShell>
  );
}
