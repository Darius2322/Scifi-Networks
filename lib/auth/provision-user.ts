import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Supabase Auth requires an email address even when the product-facing login
 * is "username + password" (agents) or "username-or-email" (staff). For
 * accounts without a real email, we generate a stable internal one that is
 * never shown to the end user and never used for actual delivery — it exists
 * purely so Supabase Auth has something unique to key on. Real emails (when
 * provided) are used as-is.
 */
export function internalAuthEmail(username: string): string {
  return `${username.toLowerCase()}@agents.scifinetworks.internal`;
}

/**
 * Creates the Supabase Auth identity + app_users row for a new staff or
 * agent account, in that order, rolling back the auth user if the app_users
 * insert fails (avoids orphaned auth accounts with no matching profile).
 */
export async function provisionAppUser(params: {
  fullName: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  siteId: string | null;
  initialPassword: string;
}) {
  const admin = createServiceRoleClient();
  const loginEmail = params.email || internalAuthEmail(params.username);

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: loginEmail,
    password: params.initialPassword,
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    return { ok: false as const, error: authError?.message ?? 'Could not create login credentials.' };
  }

  const { data: profile, error: profileError } = await admin
    .from('app_users')
    .insert({
      id: authUser.user.id,
      full_name: params.fullName,
      username: params.username,
      email: loginEmail,
      phone: params.phone,
      role: params.role,
      site_id: params.siteId,
      is_active: true,
      must_change_password: true,
    })
    .select('id')
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    const message = profileError?.code === '23505' ? 'That username or email is already in use.' : 'Could not create account profile.';
    return { ok: false as const, error: message };
  }

  return { ok: true as const, userId: profile.id };
}
