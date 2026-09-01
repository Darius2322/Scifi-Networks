import { createServerSupabase } from '@/lib/supabase/server';

export async function getAgentDashboardData(appUserId: string) {
  const supabase = createServerSupabase();

  const { data: agent } = await supabase
    .from('agents')
    .select(`
      id, physical_location, responsibilities, status, created_at,
      sites ( id, name, network_status ),
      customers ( full_name, phone, email )
    `)
    .eq('app_user_id', appUserId)
    .single();

  if (!agent) {
    return { agent: null, vouchers: [], tickets: [] };
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
