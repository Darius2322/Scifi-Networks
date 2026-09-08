import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const schema = z.object({ status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

  const { error } = await supabase
    .from('staff_tasks')
    .update({
      status: parsed.data.status,
      ...(parsed.data.status === 'completed' && { completed_at: new Date().toISOString() }),
    })
    .eq('id', params.id);

  // RLS restricts this to the assignee or a site manager at the task's
  // site — a failed update here means the caller wasn't authorized.
  if (error) return NextResponse.json({ error: 'Could not update task.' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
