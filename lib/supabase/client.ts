import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client — uses the public anon key only. RLS policies (see
 * db/002_rls.sql) are what actually protect data; this client can never
 * see more than the policies allow regardless of what the frontend does.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
