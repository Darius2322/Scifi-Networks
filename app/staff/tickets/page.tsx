import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { StaffShell } from '@/components/staff/staff-shell';

const PRIORITY_STYLE: Record<string, string> = {
  low: 'text-ink-800/50',
  normal: 'text-ink-800/80',
  high: 'text-status-warn',
  critical: 'text-status-bad font-medium',
};

export default async function StaffTicketsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const supabase = createServerSupabase();
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, type, subject, priority, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Tickets</h1>

      <div className="mt-6 border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Ticket</th>
              <th className="p-3 font-medium">Priority</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {(tickets ?? []).map((t) => (
              <tr key={t.id}>
                <td className="p-3">
                  <Link href={`/staff/tickets/${t.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                    {t.subject}
                  </Link>
                  <p className="text-ink-800/60">{t.ticket_number}</p>
                </td>
                <td className={`p-3 capitalize ${PRIORITY_STYLE[t.priority] ?? ''}`}>{t.priority}</td>
                <td className="p-3 capitalize text-ink-800/80">{t.status.replace('_', ' ')}</td>
              </tr>
            ))}
            {(tickets ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-ink-800/60">
                  No tickets right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
