import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isRateLimited } from '@/lib/auth/rate-limit';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`review:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many reviews submitted. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check your review and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('reviews').insert({
    name: parsed.data.name,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    is_published: false, // requires admin approval before appearing publicly
  });

  if (error) return NextResponse.json({ error: "We couldn't submit that. Please try again." }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
