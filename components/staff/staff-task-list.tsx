'use client';

import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  sites: { name: string } | { name: string }[] | null;
};

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export function StaffTaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/staff/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  if (tasks.length === 0) {
    return (
      <div className="border border-ink-950/10 p-8 text-center">
        <p className="text-sm text-ink-800/60">No tasks assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const site = Array.isArray(task.sites) ? task.sites[0] : task.sites;
        return (
          <div key={task.id} className="border border-ink-950/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink-950">{task.title}</p>
                {task.description && <p className="mt-1 text-sm text-ink-800/70">{task.description}</p>}
                <p className="mt-2 text-xs text-ink-800/50">
                  {site?.name ?? 'Any site'} · Assigned {new Date(task.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </p>
              </div>
              <select
                value={task.status}
                onChange={(e) => updateStatus(task.id, e.target.value)}
                className="border border-ink-950/15 bg-paper-50 px-2 py-1.5 text-xs shrink-0"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
