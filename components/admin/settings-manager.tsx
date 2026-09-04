'use client';

import { useState } from 'react';

type Contact = { phone?: string; email?: string; whatsapp?: string };
type Social = { facebook?: string; twitter?: string; instagram?: string; tiktok?: string };

export function SettingsManager({ initialSettings }: { initialSettings: Record<string, any> }) {
  return (
    <div className="space-y-8">
      <ContactSection initial={initialSettings.company_contact ?? {}} />
      <SocialSection initial={initialSettings.social_links ?? {}} />
      <TextSection settingKey="terms_and_conditions" title="Terms & Conditions" initial={initialSettings.terms_and_conditions ?? ''} />
      <TextSection settingKey="privacy_policy" title="Privacy Policy" initial={initialSettings.privacy_policy ?? ''} />
    </div>
  );
}

function useSaveSetting() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(key: string, value: unknown) {
    setSaving(true);
    setSaved(false);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return { save, saving, saved };
}

function ContactSection({ initial }: { initial: Contact }) {
  const { save, saving, saved } = useSaveSetting();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await save('company_contact', Object.fromEntries(formData.entries()));
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-950/10 p-5 space-y-3">
      <h2 className="font-medium text-ink-950">Contact information</h2>
      <input name="phone" defaultValue={initial.phone} placeholder="Phone (e.g. +254700000000)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <input name="email" defaultValue={initial.email} placeholder="Support email" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <input name="whatsapp" defaultValue={initial.whatsapp} placeholder="WhatsApp number" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <SaveButton saving={saving} saved={saved} />
    </form>
  );
}

function SocialSection({ initial }: { initial: Social }) {
  const { save, saving, saved } = useSaveSetting();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await save('social_links', Object.fromEntries(formData.entries()));
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-950/10 p-5 space-y-3">
      <h2 className="font-medium text-ink-950">Social media</h2>
      <input name="facebook" defaultValue={initial.facebook} placeholder="Facebook URL" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <input name="twitter" defaultValue={initial.twitter} placeholder="X / Twitter URL" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <input name="instagram" defaultValue={initial.instagram} placeholder="Instagram URL" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <input name="tiktok" defaultValue={initial.tiktok} placeholder="TikTok URL" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <SaveButton saving={saving} saved={saved} />
    </form>
  );
}

function TextSection({ settingKey, title, initial }: { settingKey: string; title: string; initial: string }) {
  const { save, saving, saved } = useSaveSetting();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await save(settingKey, formData.get('content'));
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-950/10 p-5 space-y-3">
      <h2 className="font-medium text-ink-950">{title}</h2>
      <textarea
        name="content"
        defaultValue={initial}
        rows={10}
        className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm font-mono"
        placeholder="Plain text or simple paragraphs, one per line…"
      />
      <SaveButton saving={saving} saved={saved} />
    </form>
  );
}

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button type="submit" disabled={saving} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
        {saving ? 'Saving…' : 'Save'}
      </button>
      {saved && <span className="text-xs text-status-good">Saved</span>}
    </div>
  );
}
