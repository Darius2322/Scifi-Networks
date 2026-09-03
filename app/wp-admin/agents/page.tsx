import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { AgentManager } from '@/components/admin/agent-manager';

export default async function AdminAgentsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: agents }, { data: sites }] = await Promise.all([
    supabase
      .from('agents')
      .select('id, physical_location, status, created_at, sites(id, name), customers(full_name, phone, email)')
      .order('created_at', { ascending: false }),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Agents</h1>
      <div className="mt-6">
        <AgentManager initialAgents={agents ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
