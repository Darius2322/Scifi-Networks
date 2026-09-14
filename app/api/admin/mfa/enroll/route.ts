import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) return NextResponse.json({ error: error.message || 'Could not start 2FA setup.' }, { status: 400 });

  return NextResponse.json({
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  });
}
