import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { SiteEditForm } from '@/components/admin/site-edit-form';

export default async function AdminSiteDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServerSupabase();

  const [{ data: site }, { data: eligibleManagers }, { data: staffAtSite }, { data: customerCount }, { data: openTickets }] =
    await Promise.all([
      supabase.from('sites').select('*').eq('id', params.id).single(),
      supabase.from('app_users').select('id, full_name, role').in('role', ['site_manager', 'supervisor']).eq('is_active', true),
      supabase.from('app_users').select('id, full_name, role').eq('site_id', params.id),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('site_id', params.id) as any,
      supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', params.id)
        .not('status', 'in', '(resolved,completed,cancelled)') as any,
    ]);

  if (!site) notFound();

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">{site.name}</h1>

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Staff at site" value={(staffAtSite ?? []).length} />
            <StatCard label="Customers" value={customerCount?.count ?? 0} />
            <StatCard label="Open tickets" value={openTickets?.count ?? 0} />
          </div>

          <div className="border border-ink-950/10 p-5">
            <h2 className="font-medium text-ink-950">Staff at this site</h2>
            {(staffAtSite ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-ink-800/60">No staff assigned to this site yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink-950/10">
                {staffAtSite!.map((s: any) => (
                  <li key={s.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-ink-950">{s.full_name}</span>
                    <span className="text-ink-800/60 capitalize">{s.role.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border border-ink-950/10 p-5 h-fit">
          <h2 className="font-medium text-ink-950">Site settings</h2>
          <div className="mt-4">
            <SiteEditForm site={site} eligibleManagers={eligibleManagers ?? []} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink-950/10 p-4">
      <p className="font-display text-2xl font-semibold text-ink-950">{value}</p>
      <p className="mt-1 text-xs text-ink-800/60">{label}</p>
    </div>
  );
}
