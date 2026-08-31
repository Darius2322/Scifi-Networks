-- ============================================================================
-- SciFi Networks — Custom Access Token Hook
--
-- This function must be registered in Supabase Dashboard under:
--   Authentication -> Hooks -> Custom Access Token
-- Select this function: public.custom_access_token_hook
--
-- Without this, auth.jwt() -> 'app_metadata' ->> 'role' will be empty and
-- every RLS policy in 002_rls.sql that checks auth_role()/auth_site_id()
-- will silently deny access. This is the missing link between "a user is
-- logged in" and "the database knows what they're allowed to see."
-- ============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
  user_site_id uuid;
  user_active boolean;
begin
  select role, site_id, is_active
    into user_role, user_site_id, user_active
  from public.app_users
  where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_role is not null and user_active = true then
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));
    if user_site_id is not null then
      claims := jsonb_set(claims, '{app_metadata,site_id}', to_jsonb(user_site_id::text));
    end if;
  else
    -- No matching active app_users row (or deactivated account) — issue a
    -- token with no role claim at all, so every is_owner_or_admin() /
    -- is_site_scoped_staff() check in RLS evaluates to false by default.
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb('none'::text));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- The Supabase Auth service (not end users) must be able to call this hook.
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
