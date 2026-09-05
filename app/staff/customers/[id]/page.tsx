import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { StaffShell } from '@/components/staff/staff-shell';
import { CustomerNotesPanel } from '@/components/staff/customer-notes-panel';

export default async function StaffCustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const supabase = createServerSupabase();
  const [{ data: customer }, { data: installations }, { data: tickets }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', params.id).single(),
    supabase.from('installations').select('id, ticket_number, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('tickets').select('id, ticket_number, type, subject, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
  ]);

  if (!customer) notFound();

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">{customer.full_name}</h1>
      <p className="mt-1 text-sm text-ink-800/70">
        {customer.phone} {customer.email && `· ${customer.email}`} · {customer.estate_area}
      </p>

      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <div className="border border-ink-950/10 p-5">
          <h2 className="text-sm font-medium text-ink-950">Installations</h2>
          {(installations ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-ink-800/60">None yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink-950/10">
              {installations!.map((i) => (
                <li key={i.id} className="py-2.5 text-sm">
                  <p className="font-medium text-ink-950">{i.ticket_number}</p>
                  <p className="text-ink-800/60 capitalize">{i.status.replace('_', ' ')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-ink-950/10 p-5">
          <h2 className="text-sm font-medium text-ink-950">Tickets</h2>
          {(tickets ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-ink-800/60">None yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink-950/10">
              {tickets!.map((t) => (
                <li key={t.id} className="py-2.5 text-sm">
                  <p className="font-medium text-ink-950">{t.subject}</p>
                  <p className="text-ink-800/60">{t.ticket_number} · {t.status.replace('_', ' ')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CustomerNotesPanel customerId={customer.id} />
      </div>
    </StaffShell>
  );
}
