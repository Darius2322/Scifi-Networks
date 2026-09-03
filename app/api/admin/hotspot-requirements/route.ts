import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

const schema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('hotspot_requirements').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: 'Could not load requirements.' }, { status: 500 });
  return NextResponse.json({ requirements: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('hotspot_requirements').insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
  });
  if (error) return NextResponse.json({ error: 'Could not add requirement.' }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
