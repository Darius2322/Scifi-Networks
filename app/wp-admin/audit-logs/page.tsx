import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminAuditLogsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServerSupabase();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, site_id, metadata, created_at, sites(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  const { data: actors } =
    actorIds.length > 0 ? await supabase.from('app_users').select('id, full_name').in('id', actorIds) : { data: [] };

  const actorName = (id: string | null) => actors?.find((a) => a.id === id)?.full_name ?? 'System';

  return (
    <AdminShell fullName={session.full_name}>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Audit Logs</h1>
        <p className="text-xs text-ink-800/50">Read-only · entries cannot be edited or deleted</p>
      </div>

      <div className="mt-6 border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Actor</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {(logs ?? []).map((log) => {
              const site = Array.isArray(log.sites) ? log.sites[0] : log.sites;
              return (
                <tr key={log.id}>
                  <td className="p-3 text-ink-800/70 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="p-3 text-ink-950">{actorName(log.actor_id)}</td>
                  <td className="p-3 text-ink-800/80 font-mono text-xs">{log.action}</td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                </tr>
              );
            })}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
