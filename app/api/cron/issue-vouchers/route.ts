import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Triggered daily by Vercel Cron (see vercel.json). Keeps auto-issuance
 * agents supplied with a voucher even if they haven't logged in recently —
 * the lazy check on dashboard load (lib/data/agent.ts) covers the rest.
 */
export async function GET(req: Request) {
  // Vercel Cron requests carry this header; reject anything else so this
  // endpoint can't be used to trigger mass voucher issuance externally.
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('status', 'active')
    .eq('auto_issue_vouchers', true);

  let issued = 0;
  for (const agent of agents ?? []) {
    const { data } = await supabase.rpc('ensure_agent_voucher', { p_agent_id: agent.id });
    if (data) issued += 1;
  }

  return NextResponse.json({ checked: agents?.length ?? 0, issued });
}
