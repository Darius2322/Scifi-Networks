import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { SettingsManager } from '@/components/admin/settings-manager';

export default async function AdminSettingsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const { data } = await supabase.from('settings').select('key, value').in('key', ['company_contact', 'social_links', 'terms_and_conditions', 'privacy_policy']);

  const settings: Record<string, any> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Settings</h1>
      <p className="mt-2 text-sm text-ink-800/70">
        Contact details, social links, and legal text shown across the public site.
      </p>
      <div className="mt-6 max-w-2xl">
        <SettingsManager initialSettings={settings} />
      </div>
    </AdminShell>
  );
}
