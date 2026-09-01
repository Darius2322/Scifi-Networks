import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const addUpdateSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  is_internal: z.boolean().default(false),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please write a message before submitting.' }, { status: 400 });
  }

  const { data: update, error } = await supabase
    .from('ticket_updates')
    .insert({
      ticket_id: params.id,
      author_id: user.id,
      message: parsed.data.message,
      is_internal: parsed.data.is_internal,
    })
    .select('id')
    .single();

  if (error || !update) return NextResponse.json({ error: 'Could not add update.' }, { status: 400 });

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

  return NextResponse.json({ id: update.id }, { status: 201 });
}
