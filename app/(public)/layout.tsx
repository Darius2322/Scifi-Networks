import { MobileBottomNav } from '@/components/marketing/mobile-bottom-nav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Spacer so the fixed bottom nav never covers the last bit of page
          content on mobile — matches the nav's own height. */}
      <div className="h-16 sm:hidden" aria-hidden="true" />
      <MobileBottomNav />
    </>
  );
}
