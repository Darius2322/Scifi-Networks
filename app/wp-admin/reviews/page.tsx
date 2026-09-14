import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { ReviewModerationList } from '@/components/admin/review-moderation-list';

export default async function AdminReviewsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();
  const { data: reviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Reviews</h1>
      <div className="mt-6">
        <ReviewModerationList initialReviews={reviews ?? []} />
      </div>
    </AdminShell>
  );
}
