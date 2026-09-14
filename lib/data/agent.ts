import { createServerSupabase } from '@/lib/supabase/server';

export async function getAgentDashboardData(appUserId: string) {
  const supabase = createServerSupabase();

  const { data: agent } = await supabase
    .from('agents')
    .select(`
      id, physical_location, responsibilities, status, created_at, auto_issue_vouchers, voucher_duration_days,
      sites ( id, name, network_status ),
      customers ( full_name, phone, email )
    `)
    .eq('app_user_id', appUserId)
    .single();

  if (!agent) {
    return { agent: null, vouchers: [], tickets: [] };
  }

  // Lazily ensure an auto-issuance agent always has a live voucher waiting,
  // without requiring the daily cron to have run yet.
  if (agent.auto_issue_vouchers) {
    await supabase.rpc('ensure_agent_voucher', { p_agent_id: agent.id });
  }

  const [vouchers, tickets] = await Promise.all([
    supabase
      .from('vouchers')
      .select('id, code, status, value_kes, issued_at, expires_at, used_at')
      .eq('agent_id', agent.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('tickets')
      .select('id, ticket_number, type, subject, status, priority, created_at')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    agent,
    vouchers: vouchers.data ?? [],
    tickets: tickets.data ?? [],
  };
}
