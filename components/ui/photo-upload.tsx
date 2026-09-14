'use client';

import { useState } from 'react';

export function PhotoUpload({ ticketId, attachmentToken }: { ticketId: string; attachmentToken?: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: attachmentToken ? { 'x-attachment-token': attachmentToken } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not upload the photo.');
        return;
      }
      setUploaded((n) => n + 1);
    } catch {
      setError('Something went wrong uploading that photo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mt-4">
      {error && <p className="mb-2 text-xs text-status-bad">{error}</p>}
      <label className="inline-flex items-center gap-2 rounded-lg border border-paper-200 px-3.5 py-2.5 text-xs font-medium text-ink-950 cursor-pointer hover:border-ink-950/30 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M7 8l5-5 5 5M12 3v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {uploading ? 'Uploading…' : uploaded > 0 ? `Add another photo (${uploaded} attached)` : 'Attach a photo (optional)'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={uploading} className="hidden" />
      </label>
      <p className="mt-1.5 text-xs text-ink-700/70">JPEG, PNG, or WebP — up to 5MB</p>
    </div>
  );
}
