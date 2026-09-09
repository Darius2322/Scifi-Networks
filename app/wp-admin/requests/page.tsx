import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminRequestsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const [{ data: installations }, { data: tickets }] = await Promise.all([
    supabase
      .from('installations')
      .select('id, ticket_number, status, created_at, sites(name), customers(full_name, phone, email), packages(name)')
      .in('status', ['submitted', 'pending_review', 'approved'])
      .order('created_at', { ascending: false }),
    supabase
      .from('tickets')
      .select('id, ticket_number, type, subject, priority, status, created_at, sites(name), customers(full_name, phone, email), reporter_name, reporter_contact')
      .not('status', 'in', '(resolved,completed,cancelled)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Requests</h1>
      <p className="mt-2 text-sm text-ink-800/70">
        Everything needing attention right now — new installation requests and open tickets, in one place.
      </p>

      <section className="mt-8">
        <h2 className="font-medium text-ink-950">New installation requests</h2>
        <div className="mt-3 border border-ink-950/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
              <tr>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Site</th>
                <th className="p-3 font-medium">Package</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {(installations ?? []).map((inst) => {
                const customer = Array.isArray(inst.customers) ? inst.customers[0] : inst.customers;
                const site = Array.isArray(inst.sites) ? inst.sites[0] : inst.sites;
                const pkg = Array.isArray(inst.packages) ? inst.packages[0] : inst.packages;
                return (
                  <tr key={inst.id}>
                    <td className="p-3">
                      <Link href={`/wp-admin/installations`} className="font-medium text-ink-950 hover:text-signal-500">
                        {customer?.full_name ?? '—'}
                      </Link>
                      <p className="text-ink-800/50">{inst.ticket_number}</p>
                    </td>
                    <td className="p-3 text-ink-800/70">
                      {customer?.phone && <div>{customer.phone}</div>}
                      {customer?.email && <div className="text-xs text-ink-800/50">{customer.email}</div>}
                    </td>
                    <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                    <td className="p-3 text-ink-800/70">{pkg?.name ?? 'Not selected'}</td>
                    <td className="p-3 capitalize text-ink-800/80">{inst.status.replace('_', ' ')}</td>
                  </tr>
                );
              })}
              {(installations ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-800/60">
                    No new installation requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium text-ink-950">Open tickets</h2>
        <div className="mt-3 border border-ink-950/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
              <tr>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Site</th>
                <th className="p-3 font-medium">Priority</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {(tickets ?? []).map((t) => {
                const customer = Array.isArray(t.customers) ? t.customers[0] : t.customers;
                const site = Array.isArray(t.sites) ? t.sites[0] : t.sites;
                const contactName = customer?.full_name ?? t.reporter_name ?? 'Anonymous';
                const contactDetail = customer?.phone ?? customer?.email ?? t.reporter_contact ?? null;
                return (
                  <tr key={t.id}>
                    <td className="p-3">
                      <Link href={`/wp-admin/tickets/${t.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                        {t.subject}
                      </Link>
                      <p className="text-ink-800/50">{t.ticket_number}</p>
                    </td>
                    <td className="p-3 text-ink-800/70">
                      <div>{contactName}</div>
                      {contactDetail && <div className="text-xs text-ink-800/50">{contactDetail}</div>}
                    </td>
                    <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                    <td className="p-3 capitalize text-ink-800/80">{t.priority}</td>
                    <td className="p-3 capitalize text-ink-800/80">{t.status.replace('_', ' ')}</td>
                  </tr>
                );
              })}
              {(tickets ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-800/60">
                    No open tickets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
