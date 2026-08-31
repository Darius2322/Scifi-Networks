import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/admin/admin-login-form';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-xl font-semibold text-white">SciFi Networks</p>
        <p className="text-center text-sm text-paper-200/60 mt-1">Owner / Administrator Access</p>

        <div className="mt-8 bg-paper-50 p-6">
          <AdminLoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-paper-200/40">
          This area is protected by authentication and role checks, independent of this URL.
        </p>
      </div>
    </div>
  );
}
