import { redirect } from 'next/navigation';
import { getAppUserSession } from '@/lib/auth/app-session';
import { AgentShell } from '@/components/track/agent-shell';
import { AgentReportIssueForm } from '@/components/track/agent-report-issue-form';

export default async function AgentReportIssuePage() {
  const session = await getAppUserSession();
  if (!session) redirect('/track/agent');
  if (session.role !== 'agent') redirect('/track/agent');

  return (
    <AgentShell fullName={session.full_name}>
      <div className="max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Report an issue</h1>
        <p className="mt-2 text-ink-800/80">
          Thanks for keeping an eye on the network. Let us know what you're seeing.
        </p>
        <div className="mt-8">
          <AgentReportIssueForm />
        </div>
      </div>
    </AgentShell>
  );
}
