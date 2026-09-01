import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { PackageManager } from '@/components/admin/package-manager';

export default async function AdminPackagesPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServerSupabase();
  const [{ data: packages }, { data: sites }] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name, speed_mbps, price_kes, duration_days, description, features, is_active, is_archived, package_sites(site_id)')
      .order('price_kes'),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Packages</h1>
      <div className="mt-6">
        <PackageManager initialPackages={packages ?? []} sites={sites ?? []} />
      </div>
    </AdminShell>
  );
}
