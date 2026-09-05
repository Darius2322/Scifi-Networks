import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';

export type AppUserSession = {
  id: string;
  full_name: string;
  role: string;
  site_id: string | null;
  must_change_password: boolean;
};

/**
 * Returns the full app_users profile for the current Supabase Auth session,
 * or null if not logged in / no matching profile. This is the source of
 * truth for role checks in server components and route handlers — the JWT
 * claims (set by the auth hook in 004_auth_hook.sql) are what RLS uses, but
 * pages should look up the fresh row so a role change takes effect without
 * waiting for token refresh.
 */
export async function getAppUserSession(): Promise<AppUserSession | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Service role for this one lookup: app_users RLS allows a user to read
  // their own row via id = auth_user_id(), so the session client would also
  // work here — service role is used only to avoid a double round trip
  // through PostgREST policy evaluation on every single page load.
  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from('app_users')
    .select('id, full_name, role, site_id, must_change_password, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    site_id: profile.site_id,
    must_change_password: profile.must_change_password,
  };
}

export const STAFF_ROLES = [
  'owner',
  'admin',
  'site_manager',
  'supervisor',
  'technician',
  'support_staff',
  'inventory_staff',
  'customer_care',
];

export const ADMIN_ROLES = ['owner', 'admin'];
