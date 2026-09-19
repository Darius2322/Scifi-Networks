import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { CartView } from '@/components/shop/cart-view';

export const metadata: Metadata = {
  title: 'Your Cart',
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-page section-py max-w-2xl">
        <CartView />
      </main>
      <SiteFooter />
    </>
  );
}
