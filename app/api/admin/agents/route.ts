import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';
import { provisionAppUser } from '@/lib/auth/provision-user';
import { normalizePhoneForDefaultPassword } from '@/lib/auth/password';

const createAgentSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9_.]+$/, 'Use lowercase letters, numbers, underscores, and periods only'),
  phone: z.string().trim().min(9).max(20),
  email: z.string().trim().email().optional().or(z.literal('')),
  site_id: z.string().uuid(),
  physical_location: z.string().trim().max(200).optional().or(z.literal('')),
  responsibilities: z.array(z.string().trim().max(150)).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('agents')
    .select('id, physical_location, status, created_at, sites(name), customers(full_name, phone, email)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Could not load agents.' }, { status: 500 });
  return NextResponse.json({ agents: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the agent details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const data = parsed.data;

  // 1. Create the lightweight customer record backing this agent.
  const { data: customer, error: customerErr } = await supabase
    .from('customers')
    .insert({
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      site_id: data.site_id,
      is_agent: true,
    })
    .select('id')
    .single();

  if (customerErr || !customer) {
    return NextResponse.json({ error: 'Could not create the agent record.' }, { status: 500 });
  }

  // 2. Provision login credentials — initial password = phone number, per
  // spec, forced to change on first login (see provisionAppUser).
  const provisioned = await provisionAppUser({
    fullName: data.full_name,
    username: data.username,
    email: data.email || null,
    phone: data.phone,
    role: 'agent',
    siteId: data.site_id,
    initialPassword: normalizePhoneForDefaultPassword(data.phone),
  });

  if (!provisioned.ok) {
    await supabase.from('customers').delete().eq('id', customer.id);
    return NextResponse.json({ error: provisioned.error }, { status: 400 });
  }

  // 3. Create the agent record linking customer + login + site.
  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .insert({
      customer_id: customer.id,
      app_user_id: provisioned.userId,
      site_id: data.site_id,
      physical_location: data.physical_location || null,
      ...(data.responsibilities && data.responsibilities.length > 0 && { responsibilities: data.responsibilities }),
      created_by: auth.userId,
    })
    .select('id')
    .single();

  if (agentErr || !agent) {
    return NextResponse.json({ error: 'Could not finish creating the agent.' }, { status: 500 });
  }

  await logAudit({
    actorId: auth.userId,
    action: 'agent.created',
    entityType: 'agent',
    entityId: agent.id,
    siteId: data.site_id,
    metadata: { username: data.username },
  });

  return NextResponse.json({ id: agent.id, username: data.username }, { status: 201 });
}
