'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = { id: string; name: string };
type StaffMember = {
  id: string;
  full_name: string;
  username: string | null;
  email: string | null;
  role: string;
  site_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  sites: { name: string } | { name: string }[] | null;
};

const ROLES = ['site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff'];

export function StaffManager({ initialStaff, sites }: { initialStaff: StaffMember[]; sites: Site[] }) {
  const router = useRouter();

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialStaff.map((member) => (
              <StaffRow key={member.id} member={member} sites={sites} onChanged={() => router.refresh()} />
            ))}
            {initialStaff.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-ink-950/10 p-5 h-fit">
        <h2 className="font-medium text-ink-950">Add staff</h2>
        <div className="mt-4">
          <CreateStaffForm sites={sites} onCreated={() => router.refresh()} />
        </div>
      </div>
    </div>
  );
}

function StaffRow({ member, sites, onChanged }: { member: StaffMember; sites: Site[]; onChanged: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const site = Array.isArray(member.sites) ? member.sites[0] : member.sites;

  async function updateField(field: string, value: unknown) {
    setSubmitting(true);
    await fetch(`/api/admin/staff/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSubmitting(false);
    onChanged();
  }

  return (
    <tr>
      <td className="p-3">
        <p className="font-medium text-ink-950">{member.full_name}</p>
        <p className="text-ink-800/60">{member.username}</p>
      </td>
      <td className="p-3">
        <select
          defaultValue={member.role}
          disabled={submitting}
          onChange={(e) => updateField('role', e.target.value)}
          className="border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace('_', ' ')}
            </option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <select
          defaultValue={member.site_id ?? ''}
          disabled={submitting}
          onChange={(e) => updateField('site_id', e.target.value)}
          className="border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs"
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <span className={member.is_active ? 'text-status-good' : 'text-ink-800/50'}>
          {member.is_active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td className="p-3 text-right">
        <button
          onClick={() => updateField('is_active', !member.is_active)}
          disabled={submitting}
          className="text-signal-500 hover:text-signal-600"
        >
          {member.is_active ? 'Disable' : 'Reactivate'}
        </button>
      </td>
    </tr>
  );
}

function CreateStaffForm({ sites, onCreated }: { sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function generatePassword() {
    return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase() + '!1';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const initialPassword = generatePassword();

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(formData.entries()), initial_password: initialPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create staff account.');
        return;
      }
      setSuccess(`Created. Username: ${json.username} · Temporary password: ${initialPassword} — share this securely; they'll be asked to change it on first login.`);
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
      <Field label="Username" name="username" required placeholder="e.g. mkinyua" />
      <Field label="Email (optional)" name="email" type="email" />
      <Field label="Phone (optional)" name="phone" />

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-ink-950">
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

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

      <Field label="Job title (optional)" name="job_title" />

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Create staff account'}
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
