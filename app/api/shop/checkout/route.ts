import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isRateLimited } from '@/lib/auth/rate-limit';
import { formatMpesaPhone, initiateStkPush } from '@/lib/mpesa';

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string().trim().min(9).max(15),
  customer_email: z.string().trim().email().max(160).optional().or(z.literal('')),
  delivery_address: z.string().trim().min(4).max(300),
  site_id: z.string().uuid().optional().or(z.literal('')),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1)
    .max(30),
});

/**
 * Creates a product order and kicks off an M-Pesa STK push. Line prices are
 * NEVER trusted from the client — every price is re-read from `products`
 * here, same principle as get-connected/report-issue not trusting client
 * data for anything that matters.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`shop-checkout:${ip}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  }

  const phone = formatMpesaPhone(parsed.data.customer_phone);
  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid Safaricom M-Pesa number.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Re-read live prices/stock — the only source of truth for the amount charged.
  const productIds = parsed.data.items.map((i) => i.product_id);
  const { data: products, error: productsErr } = await supabase
    .from('products')
    .select('id, name, price_kes, stock_qty, is_active, is_archived')
    .in('id', productIds);

  if (productsErr || !products || products.length === 0) {
    return NextResponse.json({ error: 'One or more items are no longer available.' }, { status: 400 });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const lineItems: { product_id: string; product_name: string; unit_price_kes: number; quantity: number; line_total_kes: number }[] = [];
  let subtotal = 0;

  for (const item of parsed.data.items) {
    const product = productMap.get(item.product_id);
    if (!product || !product.is_active || product.is_archived) {
      return NextResponse.json({ error: `${product?.name ?? 'An item'} is no longer available.` }, { status: 400 });
    }
    if (product.stock_qty < item.quantity) {
      return NextResponse.json({ error: `Only ${product.stock_qty} of ${product.name} left in stock.` }, { status: 400 });
    }
    const lineTotal = Number(product.price_kes) * item.quantity;
    subtotal += lineTotal;
    lineItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_kes: Number(product.price_kes),
      quantity: item.quantity,
      line_total_kes: lineTotal,
    });
  }

  const { data: orderNumber, error: seqErr } = await supabase.rpc('next_ticket_number', { p_prefix: 'SHOP' });
  if (seqErr || !orderNumber) {
    return NextResponse.json({ error: "We couldn't start checkout. Please try again." }, { status: 500 });
  }

  const { data: order, error: orderErr } = await supabase
    .from('product_orders')
    .insert({
      order_number: orderNumber,
      customer_name: parsed.data.customer_name,
      customer_phone: phone,
      customer_email: parsed.data.customer_email || null,
      delivery_address: parsed.data.delivery_address,
      site_id: parsed.data.site_id || null,
      subtotal_kes: subtotal,
      status: 'pending_payment',
    })
    .select('id, order_number')
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "We couldn't start checkout. Please try again." }, { status: 500 });
  }

  await supabase.from('product_order_items').insert(
    lineItems.map((li) => ({ ...li, order_id: order.id }))
  );

  try {
    const stk = await initiateStkPush({
      phone,
      amount: subtotal,
      accountReference: order.order_number,
      transactionDesc: 'SciFi Shop',
    });

    await supabase
      .from('product_orders')
      .update({
        mpesa_checkout_request_id: stk.checkoutRequestId,
        mpesa_merchant_request_id: stk.merchantRequestId,
      })
      .eq('id', order.id);

    await supabase.from('audit_logs').insert({
      action: 'product_order.created',
      entity_type: 'product_order',
      entity_id: order.id,
      metadata: { order_number: order.order_number, subtotal_kes: subtotal, source: 'public_shop' },
    });

    return NextResponse.json({ order_number: order.order_number, checkout_request_id: stk.checkoutRequestId }, { status: 201 });
  } catch (err) {
    // Order row stays as pending_payment — the customer (or staff) can see
    // it never got an STK push and retry, rather than losing the order.
    console.error('STK push failed', err);
    return NextResponse.json(
      { error: 'Could not reach M-Pesa right now. Please try again in a moment.', order_number: order.order_number },
      { status: 502 }
    );
  }
}
