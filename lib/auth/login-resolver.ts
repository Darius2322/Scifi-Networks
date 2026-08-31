import { createServiceRoleClient } from '@/lib/supabase/server';

export type LoginLookupResult =
  | { ok: true; userId: string; email: string; mustChangePassword: boolean }
  | { ok: false; reason: 'not_found' | 'inactive' | 'locked' };

/**
 * Staff/admin/agent accounts can sign in with either their username or
 * email, but Supabase Auth itself always authenticates by email — so this
 * resolves whichever identifier was typed to the account's real email,
 * while enforcing role scope, active status, and lockout, all server-side
 * with the service role (app_users RLS otherwise blocks anonymous lookups).
 */
export async function resolveLoginIdentifier(
  identifier: string,
  allowedRoles: string[]
): Promise<LoginLookupResult> {
  const supabase = createServiceRoleClient();

  const { data: user } = await supabase
    .from('app_users')
    .select('id, email, is_active, role, locked_until, must_change_password')
    .or(`username.eq.${identifier},email.eq.${identifier}`)
    .in('role', allowedRoles)
    .maybeSingle();

  if (!user || !user.email) {
    return { ok: false, reason: 'not_found' };
  }
  if (!user.is_active) {
    return { ok: false, reason: 'inactive' };
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { ok: false, reason: 'locked' };
  }

  return { ok: true, userId: user.id, email: user.email, mustChangePassword: user.must_change_password };
}

/** Records a failed login attempt and locks the account after 5 in a row for 15 minutes. */
export async function recordFailedLogin(userId: string) {
  const supabase = createServiceRoleClient();
  const { data: user } = await supabase
    .from('app_users')
    .select('failed_login_attempts')
    .eq('id', userId)
    .single();

  const attempts = (user?.failed_login_attempts ?? 0) + 1;
  const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

  await supabase
    .from('app_users')
    .update({ failed_login_attempts: attempts, locked_until: lockedUntil })
    .eq('id', userId);
}

export async function recordSuccessfulLogin(userId: string) {
  const supabase = createServiceRoleClient();
  await supabase
    .from('app_users')
    .update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq('id', userId);
}
