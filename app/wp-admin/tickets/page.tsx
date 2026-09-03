import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminTicketList } from '@/components/admin/admin-ticket-list';

export default async function AdminTicketsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: tickets }, { data: sites }] = await Promise.all([
    supabase
      .from('tickets')
      .select('id, ticket_number, type, subject, priority, status, created_at, sites(name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('sites').select('id, name').order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Tickets</h1>
      <div className="mt-6">
        <AdminTicketList initialTickets={tickets ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
