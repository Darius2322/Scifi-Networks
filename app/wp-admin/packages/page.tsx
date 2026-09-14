import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { PackageManager } from '@/components/admin/package-manager';
import { HotspotRequirementsManager } from '@/components/admin/hotspot-requirements-manager';

export default async function AdminPackagesPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const [{ data: packages }, { data: sites }, { data: requirements }] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name, speed_mbps, price_kes, duration_days, description, features, is_active, is_archived, service_type, package_sites(site_id)')
      .order('price_kes'),
    supabase.from('sites').select('id, name').eq('is_active', true).order('name'),
    supabase.from('hotspot_requirements').select('id, title, description').order('sort_order'),
  ]);

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Packages</h1>
      <div className="mt-6">
        <PackageManager initialPackages={packages ?? []} sites={sites ?? []} />
      </div>
      <div className="mt-8 max-w-md">
        <HotspotRequirementsManager initialRequirements={requirements ?? []} />
      </div>
    </AdminShell>
  );
}
