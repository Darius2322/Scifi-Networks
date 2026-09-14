import { redirect, notFound } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminStaffDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const { data: staff } = await supabase
    .from('app_users')
    .select('*, sites!app_users_site_id_fkey(name), staff_profiles(job_title, employee_code, hired_at, notes)')
    .eq('id', params.id)
    .single();

  if (!staff) notFound();

  const [{ data: tasks }, { data: auditEntries }] = await Promise.all([
    supabase.from('staff_tasks').select('id, title, status, created_at, completed_at').eq('assigned_to', params.id).order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('id, action, created_at, metadata').eq('actor_id', params.id).order('created_at', { ascending: false }).limit(50),
  ]);

  const site = Array.isArray(staff.sites) ? staff.sites[0] : staff.sites;
  const profile = Array.isArray(staff.staff_profiles) ? staff.staff_profiles[0] : staff.staff_profiles;

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">{staff.full_name}</h1>
      <p className="mt-1 text-sm text-ink-800/70">
        {staff.username && `@${staff.username} · `}{staff.email} {staff.phone && `· ${staff.phone}`}
      </p>
      <p className="mt-1 text-xs text-ink-800/50">
        <span className="capitalize">{staff.role.replace('_', ' ')}</span> · {site?.name ?? 'No site'} ·{' '}
        <span className={staff.is_active ? 'text-status-good' : 'text-status-bad'}>{staff.is_active ? 'Active' : 'Disabled'}</span>
      </p>
      <p className="mt-1 text-xs text-ink-800/50">
        Joined {new Date(staff.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
        {' · '}Last login {staff.last_login_at ? new Date(staff.last_login_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="border border-ink-950/10 p-5">
          <h2 className="text-sm font-medium text-ink-950">Activity (audit trail)</h2>
          {(auditEntries ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-ink-800/60">No recorded activity yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 max-h-96 overflow-y-auto">
              {auditEntries!.map((a) => (
                <li key={a.id} className="text-sm border-b border-ink-950/5 pb-2">
                  <p className="text-ink-800 capitalize">{a.action.replace(/[._]/g, ' ')}</p>
                  <p className="text-xs text-ink-800/50">{new Date(a.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          {profile && (profile.job_title || profile.employee_code) && (
            <div className="border border-ink-950/10 p-5">
              <h2 className="text-sm font-medium text-ink-950">Employment details</h2>
              {profile.job_title && <p className="mt-2 text-sm text-ink-800">{profile.job_title}</p>}
              {profile.employee_code && <p className="text-sm text-ink-800/60">ID: {profile.employee_code}</p>}
              {profile.hired_at && (
                <p className="mt-1 text-xs text-ink-800/50">
                  Hired {new Date(profile.hired_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </p>
              )}
            </div>
          )}

          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Assigned tasks</h2>
            {(tasks ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-ink-800/60">No tasks assigned.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {tasks!.map((t) => (
                  <li key={t.id} className="text-sm">
                    <p className="text-ink-950">{t.title}</p>
                    <p className="text-xs text-ink-800/50 capitalize">
                      {t.status.replace('_', ' ')} · {new Date(t.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
