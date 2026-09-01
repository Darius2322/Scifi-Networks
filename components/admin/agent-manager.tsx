'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = { id: string; name: string };
type Agent = {
  id: string;
  physical_location: string | null;
  status: string;
  sites: { id: string; name: string } | { id: string; name: string }[] | null;
  customers: { full_name: string; phone: string | null; email: string | null } | { full_name: string; phone: string | null; email: string | null }[] | null;
};

export function AgentManager({ initialAgents, sites }: { initialAgents: Agent[]; sites: Site[] }) {
  const router = useRouter();

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Agent</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialAgents.map((agent) => (
              <AgentRow key={agent.id} agent={agent} onChanged={() => router.refresh()} />
            ))}
            {initialAgents.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No agents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-ink-950/10 p-5 h-fit">
        <h2 className="font-medium text-ink-950">Add an agent</h2>
        <p className="mt-1 text-xs text-ink-800/50">
          Initial password is set to the agent's phone number. They'll be required to change it on first login.
        </p>
        <div className="mt-4">
          <CreateAgentForm sites={sites} onCreated={() => router.refresh()} />
        </div>
      </div>
    </div>
  );
}

function AgentRow({ agent, onChanged }: { agent: Agent; onChanged: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const customer = Array.isArray(agent.customers) ? agent.customers[0] : agent.customers;
  const site = Array.isArray(agent.sites) ? agent.sites[0] : agent.sites;

  async function toggleStatus() {
    const nextStatus = agent.status === 'active' ? 'inactive' : 'active';
    setSubmitting(true);
    await fetch(`/api/admin/agents/${agent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    setSubmitting(false);
    onChanged();
  }

  return (
    <tr>
      <td className="p-3">
        <p className="font-medium text-ink-950">{customer?.full_name ?? '—'}</p>
        <p className="text-ink-800/60">{customer?.phone}</p>
      </td>
      <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
      <td className="p-3">
        <span className={agent.status === 'active' ? 'text-status-good' : 'text-ink-800/50'}>
          {agent.status}
        </span>
      </td>
      <td className="p-3 text-right">
        <button onClick={toggleStatus} disabled={submitting} className="text-signal-500 hover:text-signal-600">
          {agent.status === 'active' ? 'Disable' : 'Reactivate'}
        </button>
      </td>
    </tr>
  );
}

function CreateAgentForm({ sites, onCreated }: { sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create agent.');
        return;
      }
      setSuccess(`Agent created. Username: ${json.username}`);
      (e.target as HTMLFormElement).reset();
      onCreated();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-2.5 text-xs text-status-bad">
          {error}
        </p>
      )}
      {success && (
        <p className="border border-status-good/30 bg-status-good/5 p-2.5 text-xs text-status-good">{success}</p>
      )}

      <Field label="Full name" name="full_name" required />
      <Field label="Username" name="username" required placeholder="e.g. jkamau" />
      <Field label="Phone number" name="phone" required placeholder="07XXXXXXXX" />
      <Field label="Email (optional)" name="email" type="email" />

      <div>
        <label htmlFor="site_id" className="block text-sm font-medium text-ink-950">
          Site
        </label>
        <select
          id="site_id"
          name="site_id"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        >
          <option value="">Select a site</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Physical location (optional)" name="physical_location" />

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Create agent'}
      </button>
    </form>
  );
}

function Field({ label, name, required, type = 'text', placeholder }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
      />
    </div>
  );
}
