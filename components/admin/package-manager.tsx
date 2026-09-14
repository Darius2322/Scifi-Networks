'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = { id: string; name: string };
type Package = {
  id: string;
  name: string;
  speed_mbps: number;
  price_kes: number;
  duration_days: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  is_archived: boolean;
  service_type: string;
  package_sites: { site_id: string }[];
};

export function PackageManager({ initialPackages, sites }: { initialPackages: Package[]; sites: Site[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Package</th>
              <th className="p-3 font-medium">Speed</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialPackages.map((pkg) => (
              <PackageRow
                key={pkg.id}
                pkg={pkg}
                sites={sites}
                isEditing={editingId === pkg.id}
                onEdit={() => setEditingId(pkg.id)}
                onCancelEdit={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ))}
            {initialPackages.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No packages yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-ink-950/10 p-5 h-fit">
        <h2 className="font-medium text-ink-950">Add a package</h2>
        <div className="mt-4">
          <CreatePackageForm sites={sites} onCreated={() => router.refresh()} />
        </div>
      </div>
    </div>
  );
}

function PackageRow({
  pkg,
  sites,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
}: {
  pkg: Package;
  sites: Site[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function toggleArchive() {
    setSubmitting(true);
    await fetch(`/api/admin/packages/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: !pkg.is_archived, is_active: pkg.is_archived }),
    });
    setSubmitting(false);
    onSaved();
  }

  if (isEditing) {
    return (
      <tr>
        <td colSpan={5} className="p-4 bg-paper-100">
          <EditPackageForm pkg={pkg} sites={sites} onSaved={onSaved} onCancel={onCancelEdit} />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="p-3 font-medium text-ink-950">{pkg.name}</td>
      <td className="p-3 text-ink-800/70">{pkg.speed_mbps} Mbps</td>
      <td className="p-3 text-ink-800/70">KES {Number(pkg.price_kes).toLocaleString()}</td>
      <td className="p-3">
        {pkg.is_archived ? (
          <span className="text-ink-800/50">Archived</span>
        ) : pkg.is_active ? (
          <span className="text-status-good">Active</span>
        ) : (
          <span className="text-status-warn">Disabled</span>
        )}
      </td>
      <td className="p-3 text-right space-x-3 whitespace-nowrap">
        <button onClick={onEdit} className="text-signal-500 hover:text-signal-600">
          Edit
        </button>
        <button onClick={toggleArchive} disabled={submitting} className="text-ink-800/60 hover:text-ink-950">
          {pkg.is_archived ? 'Unarchive' : 'Archive'}
        </button>
      </td>
    </tr>
  );
}

function CreatePackageForm({ sites, onCreated }: { sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const featuresRaw = formData.get('features') as string;
    const selectedSites = formData.getAll('site_ids') as string[];

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          speed_mbps: formData.get('speed_mbps'),
          price_kes: formData.get('price_kes'),
          duration_days: formData.get('duration_days') || 30,
          description: formData.get('description'),
          features: featuresRaw ? featuresRaw.split('\n').map((f) => f.trim()).filter(Boolean) : [],
          site_ids: selectedSites,
          service_type: formData.get('service_type') || 'home',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create package.');
        return;
      }
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
      <TextField label="Name" name="name" required />
      <div>
        <label className="block text-sm font-medium text-ink-950">Service type</label>
        <select name="service_type" defaultValue="home" className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500">
          <option value="home">Home</option>
          <option value="business">Business</option>
          <option value="hotspot">Hotspot</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Speed (Mbps)" name="speed_mbps" type="number" required />
        <TextField label="Price (KES)" name="price_kes" type="number" required />
      </div>
      <TextField label="Duration (days)" name="duration_days" type="number" placeholder="30" />
      <TextAreaField label="Description" name="description" />
      <TextAreaField label="Features (one per line)" name="features" />
      <SiteCheckboxes sites={sites} name="site_ids" />
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Adding…' : 'Add package'}
      </button>
    </form>
  );
}

function EditPackageForm({ pkg, sites, onSaved, onCancel }: { pkg: Package; sites: Site[]; onSaved: () => void; onCancel: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentSiteIds = pkg.package_sites.map((ps) => ps.site_id);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const featuresRaw = formData.get('features') as string;
    const selectedSites = formData.getAll('site_ids') as string[];

    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          speed_mbps: formData.get('speed_mbps'),
          price_kes: formData.get('price_kes'),
          duration_days: formData.get('duration_days'),
          description: formData.get('description'),
          features: featuresRaw ? featuresRaw.split('\n').map((f) => f.trim()).filter(Boolean) : [],
          is_active: formData.get('is_active') === 'on',
          site_ids: selectedSites,
          service_type: formData.get('service_type'),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not save changes.');
        return;
      }
      onSaved();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-2.5 text-xs text-status-bad">
          {error}
        </p>
      )}
      <TextField label="Name" name="name" defaultValue={pkg.name} required />
      <div>
        <label className="block text-sm font-medium text-ink-950">Service type</label>
        <select name="service_type" defaultValue={pkg.service_type} className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500">
          <option value="home">Home</option>
          <option value="business">Business</option>
          <option value="hotspot">Hotspot</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Speed (Mbps)" name="speed_mbps" type="number" defaultValue={pkg.speed_mbps} required />
        <TextField label="Price (KES)" name="price_kes" type="number" defaultValue={pkg.price_kes} required />
      </div>
      <TextField label="Duration (days)" name="duration_days" type="number" defaultValue={pkg.duration_days} />
      <TextAreaField label="Description" name="description" defaultValue={pkg.description ?? ''} />
      <TextAreaField label="Features (one per line)" name="features" defaultValue={pkg.features.join('\n')} />
      <SiteCheckboxes sites={sites} name="site_ids" defaultChecked={currentSiteIds} />
      <label className="flex items-center gap-2 text-sm text-ink-950">
        <input type="checkbox" name="is_active" defaultChecked={pkg.is_active} className="h-4 w-4" />
        Active (visible on public site)
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center border border-ink-950/15 px-4 py-2.5 text-sm font-medium text-ink-950"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TextField({ label, name, required, type = 'text', defaultValue, placeholder }: any) {
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
      />
    </div>
  );
}

function TextAreaField({ label, name, defaultValue }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
      />
    </div>
  );
}

function SiteCheckboxes({ sites, name, defaultChecked = [] }: { sites: Site[]; name: string; defaultChecked?: string[] }) {
  return (
    <div>
      <p className="block text-sm font-medium text-ink-950">Available at</p>
      <div className="mt-1.5 space-y-1.5">
        {sites.map((site) => (
          <label key={site.id} className="flex items-center gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              name={name}
              value={site.id}
              defaultChecked={defaultChecked.includes(site.id)}
              className="h-4 w-4"
            />
            {site.name}
          </label>
        ))}
      </div>
    </div>
  );
}
