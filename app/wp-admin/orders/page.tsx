import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { OrderStatusButton } from '@/components/admin/order-status-button';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid — needs fulfilment',
  failed: 'Payment failed',
  cancelled: 'Cancelled',
  fulfilled: 'Fulfilled',
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'text-status-warn',
  paid: 'text-signal-500',
  failed: 'text-status-bad',
  cancelled: 'text-ink-800/50',
  fulfilled: 'text-status-good',
};

export default async function AdminOrdersPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const { data: orders } = await supabase
    .from('product_orders')
    .select('id, order_number, customer_name, customer_phone, delivery_address, subtotal_kes, status, mpesa_receipt_number, created_at, product_order_items(product_name, quantity, unit_price_kes)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Shop Orders</h1>

      <div className="mt-6 border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Items</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {(orders ?? []).map((order: any) => (
              <tr key={order.id}>
                <td className="p-3 font-medium text-ink-950">
                  {order.order_number}
                  <p className="text-xs text-ink-800/50">{new Date(order.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </td>
                <td className="p-3 text-ink-800/70">
                  {order.customer_name}
                  <p className="text-xs text-ink-800/50">{order.customer_phone}</p>
                  <p className="text-xs text-ink-800/50">{order.delivery_address}</p>
                </td>
                <td className="p-3 text-ink-800/70">
                  {order.product_order_items.map((li: any, i: number) => (
                    <p key={i}>
                      {li.quantity}× {li.product_name}
                    </p>
                  ))}
                </td>
                <td className="p-3 text-ink-800/70">KES {Number(order.subtotal_kes).toLocaleString()}</td>
                <td className={`p-3 ${STATUS_COLOR[order.status] ?? ''}`}>{STATUS_LABEL[order.status] ?? order.status}</td>
                <td className="p-3 text-right">{order.status === 'paid' && <OrderStatusButton orderId={order.id} />}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-800/60">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
