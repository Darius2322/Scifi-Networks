import type { Metadata } from 'next';
import { AgentLoginForm } from '@/components/track/agent-login-form';

export const metadata: Metadata = {
  title: 'Agent Login',
  robots: { index: false, follow: false },
};

export default function AgentLoginPage() {
  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-xl font-semibold text-ink-950">SciFi Networks</p>
        <p className="text-center text-sm text-ink-800/60 mt-1">Agent Sign In</p>

        <div className="mt-8 border border-ink-950/10 p-6">
          <AgentLoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-ink-800/60">
          Not an agent? <a href="/track" className="text-signal-500 hover:text-signal-600">Track a request instead</a>.
        </p>
      </div>
    </div>
  );
}
