import type { Metadata } from 'next';
import { StaffLoginForm } from '@/components/staff/staff-login-form';

export const metadata: Metadata = {
  title: 'Staff Login',
  robots: { index: false, follow: false },
};

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-xl font-semibold text-white">SciFi Networks</p>
        <p className="text-center text-sm text-paper-200/60 mt-1">Staff Portal</p>

        <div className="mt-8 bg-paper-50 p-6">
          <StaffLoginForm />
        </div>
      </div>
    </div>
  );
}
