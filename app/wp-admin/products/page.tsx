import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { ProductManager } from '@/components/admin/product-manager';

export default async function AdminProductsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price_kes, category, image_url, stock_qty, is_active, is_archived')
    .order('category')
    .order('name');

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Shop Products</h1>
      <div className="mt-6">
        <ProductManager initialProducts={products ?? []} />
      </div>
    </AdminShell>
  );
}
