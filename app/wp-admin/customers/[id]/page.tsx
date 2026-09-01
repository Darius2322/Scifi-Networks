import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { SuspendCustomerButton } from '@/components/admin/suspend-customer-button';

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServerSupabase();

  const [{ data: customer }, { data: installations }, { data: tickets }, { data: payments }] = await Promise.all([
    supabase.from('customers').select('*, sites(name)').eq('id', params.id).single(),
    supabase.from('installations').select('id, ticket_number, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('tickets').select('id, ticket_number, type, subject, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('id, amount_kes, method, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
  ]);

  if (!customer) notFound();
  const site = Array.isArray(customer.sites) ? customer.sites[0] : customer.sites;

  return (
    <AdminShell fullName={session.full_name}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{customer.full_name}</h1>
          <p className="mt-1 text-sm text-ink-800/70">
            {customer.phone} {customer.email && `· ${customer.email}`} · {site?.name ?? 'No site'}
          </p>
        </div>
        <SuspendCustomerButton customerId={customer.id} isSuspended={customer.is_suspended} />
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <ListPanel title="Installations">
          {(installations ?? []).map((i: any) => (
            <li key={i.id} className="py-2.5 text-sm">
              <p className="font-medium text-ink-950">{i.ticket_number}</p>
              <p className="text-ink-800/60 capitalize">{i.status.replace('_', ' ')}</p>
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Tickets">
          {(tickets ?? []).map((t: any) => (
            <li key={t.id} className="py-2.5 text-sm">
              <p className="font-medium text-ink-950">{t.subject}</p>
              <p className="text-ink-800/60">{t.ticket_number} · {t.status.replace('_', ' ')}</p>
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Payments">
          {(payments ?? []).map((p: any) => (
            <li key={p.id} className="py-2.5 text-sm">
              <p className="font-medium text-ink-950">KES {Number(p.amount_kes).toLocaleString()}</p>
              <p className="text-ink-800/60 capitalize">{p.method} · {p.status}</p>
            </li>
          ))}
        </ListPanel>
      </div>
    </AdminShell>
  );
}

function ListPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const items = children as React.ReactNode[];
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items;

  return (
    <div className="border border-ink-950/10 p-5">
      <h2 className="text-sm font-medium text-ink-950">{title}</h2>
      {isEmpty ? (
        <p className="mt-2 text-sm text-ink-800/60">Nothing yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-ink-950/10">{children}</ul>
      )}
    </div>
  );
}
