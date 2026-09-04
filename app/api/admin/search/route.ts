import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createServiceRoleClient();
  const like = `%${q}%`;

  const [customers, tickets, staff, inventory, vouchers, sites] = await Promise.all([
    supabase.from('customers').select('id, full_name, phone, email').or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`).limit(5),
    supabase.from('tickets').select('id, ticket_number, subject').or(`ticket_number.ilike.${like},subject.ilike.${like}`).limit(5),
    supabase.from('app_users').select('id, full_name, role').ilike('full_name', like).limit(5),
    supabase.from('inventory_items').select('id, name, sku').or(`name.ilike.${like},sku.ilike.${like}`).limit(5),
    supabase.from('vouchers').select('id, code').ilike('code', like).limit(5),
    supabase.from('sites').select('id, name').ilike('name', like).limit(5),
  ]);

  const results = [
    ...(customers.data ?? []).map((c) => ({ type: 'Customer', label: c.full_name, sub: c.phone ?? c.email ?? '', href: `/wp-admin/customers/${c.id}` })),
    ...(tickets.data ?? []).map((t) => ({ type: 'Ticket', label: t.subject, sub: t.ticket_number, href: `/wp-admin/tickets/${t.id}` })),
    ...(staff.data ?? []).map((s) => ({ type: 'Staff', label: s.full_name, sub: s.role, href: `/wp-admin/staff` })),
    ...(inventory.data ?? []).map((i) => ({ type: 'Inventory', label: i.name, sub: i.sku, href: `/wp-admin/inventory` })),
    ...(vouchers.data ?? []).map((v) => ({ type: 'Voucher', label: v.code, sub: '', href: `/wp-admin/vouchers` })),
    ...(sites.data ?? []).map((s) => ({ type: 'Site', label: s.name, sub: '', href: `/wp-admin/sites/${s.id}` })),
  ];

  return NextResponse.json({ results });
}
