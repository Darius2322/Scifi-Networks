import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { AdminShell } from '@/components/admin/admin-shell';
import { TicketDetail } from '@/components/admin/ticket-detail';

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  return (
    <AdminShell fullName={session.full_name}>
      <TicketDetail ticketId={params.id} basePath="/api/admin/tickets" canAssignAcrossSites />
    </AdminShell>
  );
}
