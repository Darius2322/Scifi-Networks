import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { CreateSiteForm } from '@/components/admin/create-site-form';

export default async function AdminSitesPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, slug, is_active, network_status, manager_id')
    .order('name');

  const managerIds = (sites ?? []).map((s: any) => s.manager_id).filter(Boolean) as string[];
  const { data: managers } =
    managerIds.length > 0
      ? await supabase.from('app_users').select('id, full_name').in('id', managerIds)
      : { data: [] };

  const managerName = (id: string | null) => managers?.find((m) => m.id === id)?.full_name ?? 'Unassigned';

  return (
    <AdminShell fullName={session.full_name}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Sites</h1>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="border border-ink-950/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
              <tr>
                <th className="p-3 font-medium">Site</th>
                <th className="p-3 font-medium">Manager</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {(sites ?? []).map((site) => (
                <tr key={site.id}>
                  <td className="p-3">
                    <Link href={`/wp-admin/sites/${site.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                      {site.name}
                    </Link>
                  </td>
                  <td className="p-3 text-ink-800/70">{managerName(site.manager_id)}</td>
                  <td className="p-3">
                    <span className={site.is_active ? 'text-status-good' : 'text-ink-800/50'}>
                      {site.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3 text-ink-800/70 capitalize">{site.network_status.replace('_', ' ')}</td>
                </tr>
              ))}
              {(sites ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-ink-800/60">
                    No sites yet. Add your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border border-ink-950/10 p-5 h-fit">
          <h2 className="font-medium text-ink-950">Add a site</h2>
          <div className="mt-4">
            <CreateSiteForm />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
