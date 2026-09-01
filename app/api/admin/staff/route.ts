import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';
import { provisionAppUser } from '@/lib/auth/provision-user';

const STAFF_ROLES = ['site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff'] as const;

const createStaffSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9_.]+$/, 'Use lowercase letters, numbers, underscores, and periods only'),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  role: z.enum(STAFF_ROLES),
  site_id: z.string().uuid(),
  job_title: z.string().trim().max(100).optional().or(z.literal('')),
  initial_password: z.string().min(8).max(100),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('app_users')
    .select('id, full_name, username, email, role, site_id, is_active, last_login_at, sites(name)')
    .not('role', 'in', '(agent,customer)')
    .order('full_name');

  if (error) return NextResponse.json({ error: 'Could not load staff.' }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Please check the details.' }, { status: 400 });
  }

  const data = parsed.data;

  const provisioned = await provisionAppUser({
    fullName: data.full_name,
    username: data.username,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role,
    siteId: data.site_id,
    initialPassword: data.initial_password,
  });

  if (!provisioned.ok) {
    return NextResponse.json({ error: provisioned.error }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (data.job_title) {
    await supabase.from('staff_profiles').insert({ user_id: provisioned.userId, job_title: data.job_title });
  }

  await logAudit({
    actorId: auth.userId,
    action: 'staff.created',
    entityType: 'app_users',
    entityId: provisioned.userId,
    siteId: data.site_id,
    metadata: { username: data.username, role: data.role },
  });

  return NextResponse.json({ id: provisioned.userId, username: data.username }, { status: 201 });
}
