import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';

export type AdminApiAuth =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/**
 * Verifies the caller is an authenticated, active owner/admin. Used at the
 * top of every /api/admin/* route handler — this is the actual enforcement
 * point, not the middleware (which only checks "is anyone logged in").
 */
export async function requireAdmin(): Promise<AdminApiAuth> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: 'You must be signed in.' };
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from('app_users')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active || !['owner', 'admin'].includes(profile.role)) {
    return { ok: false, status: 403, error: 'You do not have permission to do that.' };
  }

  return { ok: true, userId: user.id };
}

export async function logAudit(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createServiceRoleClient();
  await admin.from('audit_logs').insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    site_id: params.siteId ?? null,
    metadata: params.metadata ?? {},
  });
}
