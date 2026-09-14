'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Staff = { id: string; full_name: string; role: string };
type Site = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  app_users: { full_name: string } | { full_name: string }[] | null;
  sites: { name: string } | { name: string }[] | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-ink-800/60',
  in_progress: 'text-signal-500',
  completed: 'text-status-good',
  cancelled: 'text-status-bad',
};

export function TaskManager({ initialTasks, staff, sites }: { initialTasks: Task[]; staff: Staff[]; sites: Site[] }) {
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(false);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setShowAssign((v) => !v)} className="text-sm font-medium text-signal-500 hover:text-signal-600">
          {showAssign ? 'Cancel' : '+ Assign task'}
        </button>
      </div>

      {showAssign && (
        <div className="mb-6 border border-ink-950/10 p-5 max-w-md">
          <AssignTaskForm
            staff={staff}
            sites={sites}
            onCreated={() => {
              setShowAssign(false);
              router.refresh();
            }}
          />
        </div>
      )}

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Task</th>
              <th className="p-3 font-medium">Assigned to</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialTasks.map((t) => {
              const assignee = Array.isArray(t.app_users) ? t.app_users[0] : t.app_users;
              const site = Array.isArray(t.sites) ? t.sites[0] : t.sites;
              return (
                <tr key={t.id}>
                  <td className="p-3 font-medium text-ink-950">{t.title}</td>
                  <td className="p-3 text-ink-800/70">{assignee?.full_name ?? '—'}</td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? 'Any'}</td>
                  <td className={`p-3 capitalize ${STATUS_STYLE[t.status] ?? ''}`}>{t.status.replace('_', ' ')}</td>
                </tr>
              );
            })}
            {initialTasks.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No tasks assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssignTaskForm({ staff, sites, onCreated }: { staff: Staff[]; sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not assign task.');
        return;
      }
      onCreated();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <select name="assigned_to" required className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="">Assign to…</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name} ({s.role.replace('_', ' ')})
          </option>
        ))}
      </select>
      <select name="site_id" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="">Any site</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input name="title" required placeholder="Task title" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <textarea name="description" rows={3} placeholder="Description (optional)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
        {submitting ? 'Assigning…' : 'Assign task'}
      </button>
    </form>
  );
}
