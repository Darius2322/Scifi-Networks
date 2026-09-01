import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('tickets')
    .select('id, ticket_number, type, subject, priority, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Could not load tickets.' }, { status: 500 });
  return NextResponse.json({ tickets: data });
}
