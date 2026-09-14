import { redirect } from 'next/navigation';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { StaffShell } from '@/components/staff/staff-shell';
import { TicketDetail } from '@/components/admin/ticket-detail';

export default async function StaffTicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <TicketDetail ticketId={params.id} basePath="/api/staff/tickets" />
    </StaffShell>
  );
}
