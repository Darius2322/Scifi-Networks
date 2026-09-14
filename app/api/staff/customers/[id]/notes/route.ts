import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const schema = z.object({ note: z.string().trim().min(1).max(2000) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('customer_notes')
    .select('id, note, author_id, created_at')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Could not load notes.' }, { status: 500 });

  const authorIds = [...new Set((data ?? []).map((n) => n.author_id).filter(Boolean))] as string[];
  let names: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await supabase.from('app_users').select('id, full_name').in('id', authorIds);
    names = Object.fromEntries((authors ?? []).map((a: any) => [a.id, a.full_name]));
  }

  return NextResponse.json({
    notes: (data ?? []).map((n) => ({ ...n, author_name: n.author_id ? names[n.author_id] ?? 'Unknown' : 'Unknown' })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please write a note before submitting.' }, { status: 400 });

  const { error } = await supabase.from('customer_notes').insert({
    customer_id: params.id,
    author_id: user.id,
    note: parsed.data.note,
  });

  if (error) return NextResponse.json({ error: 'Could not add note.' }, { status: 400 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
