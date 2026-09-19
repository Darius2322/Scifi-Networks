import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveSites } from '@/lib/data/public';
import { CheckoutForm } from '@/components/shop/checkout-form';

export const metadata: Metadata = {
  title: 'Checkout',
};

export default async function ShopCheckoutPage() {
  const sites = await getActiveSites();

  return (
    <>
      <SiteHeader />
      <main className="container-page section-py max-w-xl">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-950">Checkout</h1>
        <p className="mt-2 text-ink-700">
          You'll get an M-Pesa prompt on your phone to complete payment.
        </p>

        <div className="mt-8">
          <CheckoutForm sites={sites} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
