import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isRateLimited } from '@/lib/auth/rate-limit';

/**
 * Deliberately returns ONLY status — no customer info, no totals. Order
 * numbers aren't secret (same trust level as a ticket number), but there's
 * no reason to expose anything beyond "is this paid yet" to an
 * unauthenticated poll.
 */
export async function GET(req: NextRequest, { params }: { params: { order_number: string } }) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`shop-status:${ip}`, 60, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = createServiceRoleClient();
  const { data: order } = await supabase
    .from('product_orders')
    .select('status')
    .eq('order_number', params.order_number)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({ status: order.status });
}
