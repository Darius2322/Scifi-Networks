import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUserSession, STAFF_ROLES } from '@/lib/auth/app-session';
import { createServerSupabase } from '@/lib/supabase/server';
import { StaffShell } from '@/components/staff/staff-shell';
import { StaffCustomerSearch } from '@/components/staff/staff-customer-search';

export default async function StaffCustomersPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/staff/login');
  if (!STAFF_ROLES.includes(session.role)) redirect('/staff/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const supabase = createServerSupabase();
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, estate_area, is_suspended')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <StaffShell fullName={session.full_name} role={session.role}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Customers</h1>
      <div className="mt-6">
        <StaffCustomerSearch initialCustomers={customers ?? []} />
      </div>
    </StaffShell>
  );
}
