const LABELS: Record<string, string> = {
  submitted: 'Request Submitted',
  pending_review: 'Reviewed',
  approved: 'Approved',
  assigned: 'Technician Assigned',
  scheduled: 'Installation Scheduled',
  completed: 'Installation Completed',
};

export function StatusTimeline({ currentStatus, stages }: { currentStatus: string; stages: readonly string[] }) {
  // "rejected" / "cancelled" are terminal off-path states — show distinctly.
  if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
    return (
      <div className="border border-status-bad/30 bg-status-bad/5 p-4 text-sm text-status-bad">
        This request was {currentStatus}. Contact support if you believe this is a mistake.
      </div>
    );
  }

  const currentIndex = stages.indexOf(currentStatus);

  return (
    <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
      {stages.map((stage, i) => {
        const isDone = currentIndex >= 0 && i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <li key={stage} className="flex sm:flex-col sm:flex-1 items-start sm:items-start gap-3 sm:gap-0">
            <div className="flex sm:w-full items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isDone
                    ? 'bg-signal-500 text-white'
                    : isCurrent
                    ? 'bg-signal-500/15 text-signal-500 ring-2 ring-signal-500'
                    : 'bg-ink-950/5 text-ink-800/40'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              {i < stages.length - 1 && (
                <span className={`hidden sm:block h-px flex-1 ${isDone ? 'bg-signal-500' : 'bg-ink-950/10'}`} />
              )}
            </div>
            <p className={`mt-0 sm:mt-2 text-sm ${isCurrent ? 'font-medium text-ink-950' : 'text-ink-800/70'}`}>
              {LABELS[stage] ?? stage}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
