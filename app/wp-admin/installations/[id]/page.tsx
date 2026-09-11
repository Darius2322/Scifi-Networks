import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminInstallationDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const { data: installation } = await supabase
    .from('installations')
    .select('*, sites(name), customers(full_name, phone, email, estate_area), packages(name, speed_mbps, price_kes)')
    .eq('id', params.id)
    .single();

  if (!installation) notFound();

  const { data: auditEntries } = await supabase
    .from('audit_logs')
    .select('id, action, created_at, metadata')
    .eq('entity_type', 'installation')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: false });

  const customer = Array.isArray(installation.customers) ? installation.customers[0] : installation.customers;
  const site = Array.isArray(installation.sites) ? installation.sites[0] : installation.sites;
  const pkg = Array.isArray(installation.packages) ? installation.packages[0] : installation.packages;

  const timeline = [
    { at: installation.created_at, label: 'Request submitted' },
    ...(installation.scheduled_at ? [{ at: installation.scheduled_at, label: 'Installation scheduled' }] : []),
    ...(installation.completed_at ? [{ at: installation.completed_at, label: 'Installation completed' }] : []),
    ...(auditEntries ?? []).map((a) => ({ at: a.created_at, label: a.action.replace(/[._]/g, ' ') })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">{installation.ticket_number}</h1>
      <p className="mt-1 text-sm text-ink-800/70 capitalize">Status: {installation.status.replace('_', ' ')}</p>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Customer</h2>
            <p className="mt-2 text-ink-950 font-medium">{customer?.full_name ?? '—'}</p>
            <p className="text-sm text-ink-800/70">
              {customer?.phone} {customer?.email && `· ${customer.email}`}
            </p>
            <p className="text-sm text-ink-800/70">{customer?.estate_area}</p>
          </div>

          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Request details</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-800/50 text-xs">Site</dt>
                <dd className="text-ink-950">{site?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-800/50 text-xs">Package</dt>
                <dd className="text-ink-950">{pkg ? `${pkg.name} (${pkg.speed_mbps} Mbps)` : 'Not selected'}</dd>
              </div>
              <div>
                <dt className="text-ink-800/50 text-xs">Preferred date/time</dt>
                <dd className="text-ink-950">
                  {installation.preferred_datetime ? new Date(installation.preferred_datetime).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-800/50 text-xs">Scheduled</dt>
                <dd className="text-ink-950">
                  {installation.scheduled_at ? new Date(installation.scheduled_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet scheduled'}
                </dd>
              </div>
            </dl>
            {installation.additional_notes && (
              <div className="mt-4">
                <p className="text-ink-800/50 text-xs">Notes</p>
                <p className="mt-1 text-sm text-ink-800">{installation.additional_notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-ink-950/10 p-5">
          <h2 className="text-sm font-medium text-ink-950">Timeline</h2>
          <ul className="mt-3 space-y-3 max-h-96 overflow-y-auto">
            {timeline.map((item, i) => (
              <li key={i} className="text-sm border-b border-ink-950/5 pb-2">
                <p className="text-ink-800 capitalize">{item.label}</p>
                <p className="text-xs text-ink-800/50">{new Date(item.at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
