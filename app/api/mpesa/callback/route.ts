import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Safaricom calls this URL directly (no auth header, no session) once the
 * customer has entered their M-Pesa PIN or the STK push has timed out /
 * been cancelled. It expects a 200 response with { ResultCode: 0 } no
 * matter what happened on our end — a non-200 or malformed response makes
 * Safaricom retry the callback repeatedly.
 *
 * Configure this exact URL as MPESA_CALLBACK_URL:
 *   https://<your-vercel-domain>/api/mpesa/callback
 */
export async function POST(req: NextRequest) {
  const ack = NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return ack;

    const supabase = createServiceRoleClient();
    const checkoutRequestId = callback.CheckoutRequestID as string;
    const success = callback.ResultCode === 0;

    if (!success) {
      await supabase
        .from('product_orders')
        .update({ status: 'failed' })
        .eq('mpesa_checkout_request_id', checkoutRequestId)
        .eq('status', 'pending_payment');
      return ack;
    }

    const items: Array<{ Name: string; Value: string | number }> = callback.CallbackMetadata?.Item ?? [];
    const get = (name: string) => items.find((i) => i.Name === name)?.Value;

    const receiptNumber = get('MpesaReceiptNumber') as string | undefined;

    const { data: order } = await supabase
      .from('product_orders')
      .update({
        status: 'paid',
        mpesa_receipt_number: receiptNumber ?? null,
        paid_at: new Date().toISOString(),
      })
      .eq('mpesa_checkout_request_id', checkoutRequestId)
      .eq('status', 'pending_payment')
      .select('id, order_number')
      .single();

    if (order) {
      await supabase.from('audit_logs').insert({
        action: 'product_order.paid',
        entity_type: 'product_order',
        entity_id: order.id,
        metadata: { order_number: order.order_number, mpesa_receipt_number: receiptNumber },
      });

      // Deduct stock now that payment is confirmed — not at order creation,
      // so an abandoned/failed checkout never holds stock hostage.
      const { data: lineItems } = await supabase
        .from('product_order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      for (const item of lineItems ?? []) {
        if (!item.product_id) continue;
        await supabase.rpc('decrement_product_stock', { p_product_id: item.product_id, p_qty: item.quantity });
      }
    }
  } catch (err) {
    console.error('M-Pesa callback processing failed', err);
    // Still ack — Safaricom will keep retrying otherwise, and the order
    // will simply be reconciled manually from the admin Orders page.
  }

  return ack;
}
