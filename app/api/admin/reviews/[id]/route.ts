import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('reviews').update({ is_published: !!body.is_published }).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not update review.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  await supabase.from('reviews').delete().eq('id', params.id);
  return NextResponse.json({ ok: true });
}
