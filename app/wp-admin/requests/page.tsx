import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { RequestsInbox } from '@/components/admin/requests-inbox';

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
        Everything needing attention right now — new installation requests and open tickets, in one place. Update status directly from here.
      </p>
      <RequestsInbox initialInstallations={installations ?? []} initialTickets={tickets ?? []} />
    </AdminShell>
  );
}
