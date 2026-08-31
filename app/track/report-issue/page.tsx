import { redirect } from 'next/navigation';
import { getTrackSession } from '@/lib/auth/track-session';
import { TrackDashboardShell } from '@/components/track/track-dashboard-shell';
import { ReportIssueForm } from '@/components/track/report-issue-form';

export default async function ReportIssuePage() {
  const session = await getTrackSession();
  if (!session) redirect('/track');

  return (
    <TrackDashboardShell installationId={session.installation_id}>
      <div className="max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Report an issue</h1>
        <p className="mt-2 text-ink-800/80">
          Let us know what's happening. We'll create a ticket and keep you updated here.
        </p>
        <div className="mt-8">
          <ReportIssueForm installationId={session.installation_id} />
        </div>
      </div>
    </TrackDashboardShell>
  );
}
