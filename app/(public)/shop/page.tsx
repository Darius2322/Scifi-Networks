import type { Metadata } from 'next';
import Image from 'next/image';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveProducts } from '@/lib/data/public';
import { AddToCartButton } from '@/components/shop/add-to-cart-button';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Routers, cables, and other internet equipment from SciFi Networks — pay online with M-Pesa.',
};

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getActiveProducts();

  const byCategory = products.reduce<Record<string, typeof products>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-paper-200 bg-paper-100">
          <div className="container-page section-py">
            <p className="eyebrow">Shop</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">Internet Equipment</h1>
            <p className="mt-2 text-ink-700 max-w-prose">
              Routers, cables, and other equipment — pay securely with M-Pesa and we'll get it to you.
            </p>
          </div>
        </div>

        <div className="container-page section-py">
          {products.length === 0 ? (
            <div className="card p-10 text-center max-w-md mx-auto">
              <p className="text-ink-700">No products are available right now. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(byCategory).map(([category, items]) => (
                <div key={category}>
                  <h2 className="font-display text-xl font-bold text-ink-950 capitalize">{category}</h2>
                  <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((product) => (
                      <div key={product.id} className="card card-hover flex flex-col p-5">
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-paper-50">
                          {product.image_url ? (
                            <Image src={product.image_url} alt={product.name} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-ink-700/30">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="mt-4 font-semibold text-ink-950">{product.name}</p>
                        {product.description && (
                          <p className="mt-1 text-sm text-ink-700 leading-relaxed line-clamp-2">{product.description}</p>
                        )}
                        <p className="mt-3 font-display text-xl font-bold text-ink-950">
                          KES {Number(product.price_kes).toLocaleString()}
                        </p>
                        {product.stock_qty > 0 && product.stock_qty <= 5 && (
                          <p className="mt-1 text-xs text-status-warn">Only {product.stock_qty} left</p>
                        )}
                        <AddToCartButton product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
