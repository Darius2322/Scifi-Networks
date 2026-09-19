'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';

export function CartView() {
  const { items, setQuantity, removeItem, subtotal } = useCart();

  return (
    <>
      <p className="eyebrow">Cart</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-950">Your Cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 card p-10 text-center">
          <p className="text-ink-700">Your cart is empty.</p>
          <Link href="/shop" className="btn-secondary mt-5 inline-flex">
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 card divide-y divide-paper-200">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-50">
                  {item.image_url && (
                    <Image src={item.image_url} alt={item.name} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-950 truncate">{item.name}</p>
                  <p className="text-sm text-ink-700">KES {item.price_kes.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-paper-200 text-ink-950 hover:border-ink-950/30"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock_qty}
                    className="h-8 w-8 rounded-lg border border-paper-200 text-ink-950 hover:border-ink-950/30 disabled:opacity-40"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.product_id)}
                  className="text-ink-700 hover:text-status-bad"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-ink-700">Subtotal</p>
            <p className="font-display text-2xl font-bold text-ink-950">KES {subtotal.toLocaleString()}</p>
          </div>

          <Link href="/shop/checkout" className="btn-primary mt-6 w-full">
            Checkout
          </Link>
        </>
      )}
    </>
  );
}
