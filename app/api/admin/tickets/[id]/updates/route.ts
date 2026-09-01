import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const addUpdateSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  is_internal: z.boolean().default(false),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = addUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please write a message before submitting.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: update, error } = await supabase
    .from('ticket_updates')
    .insert({
      ticket_id: params.id,
      author_id: auth.userId,
      message: parsed.data.message,
      is_internal: parsed.data.is_internal,
    })
    .select('id')
    .single();

  if (error || !update) return NextResponse.json({ error: 'Could not add update.' }, { status: 500 });

  // Customer-facing updates also generate a notification — internal notes never do.
  if (!parsed.data.is_internal) {
    const { data: ticket } = await supabase.from('tickets').select('customer_id, ticket_number').eq('id', params.id).single();
    if (ticket?.customer_id) {
      await supabase.from('notifications').insert({
        customer_id: ticket.customer_id,
        title: `Update on ${ticket.ticket_number}`,
        body: parsed.data.message,
        category: 'ticket',
        related_ticket_id: params.id,
      });
    }
  }

  await logAudit({
    actorId: auth.userId,
    action: parsed.data.is_internal ? 'ticket.internal_note_added' : 'ticket.customer_update_added',
    entityType: 'ticket',
    entityId: params.id,
  });

  return NextResponse.json({ id: update.id }, { status: 201 });
}
