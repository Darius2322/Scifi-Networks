import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { SecuritySettings } from '@/components/admin/security-settings';
import { SettingsTabs } from '@/components/admin/settings-tabs';

export default async function AdminSecurityPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServerSupabase();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = factors?.totp?.find((f) => f.status === 'verified') ?? null;

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Settings</h1>
      <SettingsTabs />
      <p className="mt-4 text-sm text-ink-800/70">Two-factor authentication for your own account.</p>
      <div className="mt-6 max-w-md">
        <SecuritySettings existingFactorId={verifiedTotp?.id ?? null} />
      </div>
    </AdminShell>
  );
}
