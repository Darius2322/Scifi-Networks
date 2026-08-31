import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Session-bound server client — used in server components and route
 * handlers for anything acting AS the logged-in staff/agent/admin user.
 * RLS applies normally here. Use this for 95% of server-side reads/writes.
 */
export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component with no response to write to — safe to ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            // see above
          }
        },
      },
    }
  );
}

/**
 * Service-role client — BYPASSES RLS entirely. Use ONLY in trusted
 * server-side route handlers that perform their own explicit authorization
 * checks in code, such as:
 *   - /api/track/*  (verifying ticket number + phone/email for a customer
 *     who has no Supabase Auth session at all)
 *   - password reset / initial credential provisioning
 *   - cross-site admin aggregation queries
 *
 * NEVER import this in a client component. NEVER return its result directly
 * without filtering to exactly what the caller is authorized to see.
 */
export function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceRoleClient must never be called from the browser.');
  }
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
