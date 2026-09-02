export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-50 px-5">
      <div className="text-center max-w-sm">
        <p className="font-display text-2xl font-semibold text-ink-950">You're offline</p>
        <p className="mt-3 text-ink-800/70">
          This page needs a connection to load. Reconnect and try again — your ticket number and
          account details are always safe on our servers.
        </p>
      </div>
    </div>
  );
}
