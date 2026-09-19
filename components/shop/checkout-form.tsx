'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';

type Site = { id: string; name: string };
type Stage = 'form' | 'awaiting_pin' | 'paid' | 'failed';

export function CheckoutForm({ sites }: { sites: Site[] }) {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  function pollStatus(order_number: string) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/shop/orders/${order_number}/status`);
        const json = await res.json();
        if (json.status === 'paid') {
          clearInterval(pollRef.current!);
          setStage('paid');
          clear();
        } else if (json.status === 'failed') {
          clearInterval(pollRef.current!);
          setStage('failed');
        }
      } catch {
        // transient network hiccup — keep polling
      }
      // ~90 seconds of polling with no resolution — the interval already
      // clears itself the moment status becomes paid/failed, so reaching
      // this point means it's genuinely still unresolved. Don't check
      // component state here — it's stale inside this closure.
      if (attempts >= 30) {
        clearInterval(pollRef.current!);
        setStage('failed');
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.get('customer_name'),
          customer_phone: formData.get('customer_phone'),
          customer_email: formData.get('customer_email'),
          delivery_address: formData.get('delivery_address'),
          site_id: formData.get('site_id') || undefined,
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not start checkout.');
        return;
      }
      setOrderNumber(json.order_number);
      setStage('awaiting_pin');
      pollStatus(json.order_number);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && stage === 'form') {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-700">Your cart is empty.</p>
        <Link href="/shop" className="btn-secondary mt-5 inline-flex">
          Browse the shop
        </Link>
      </div>
    );
  }

  if (stage === 'awaiting_pin') {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-signal-500 border-t-transparent animate-spin" aria-hidden="true" />
        <p className="mt-5 font-semibold text-ink-950">Check your phone</p>
        <p className="mt-2 text-sm text-ink-700">
          Enter your M-Pesa PIN to complete payment of <strong>KES {subtotal.toLocaleString()}</strong>.
        </p>
        {orderNumber && <p className="mt-3 text-xs text-ink-700">Order {orderNumber}</p>}
      </div>
    );
  }

  if (stage === 'paid') {
    return (
      <div className="animate-success card border-status-good/30 bg-status-good/5 p-8 text-center">
        <p className="text-sm font-semibold text-status-good">Payment received</p>
        <p className="mt-2 font-display text-2xl font-bold text-ink-950">{orderNumber}</p>
        <p className="mt-3 text-sm text-ink-800">We're preparing your order for delivery.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className="card border-status-bad/30 bg-status-bad/5 p-8 text-center">
        <p className="text-sm font-semibold text-status-bad">Payment didn't go through</p>
        <p className="mt-2 text-sm text-ink-800">
          The M-Pesa prompt may have timed out or been cancelled. Your cart is still saved.
        </p>
        <button type="button" onClick={() => setStage('form')} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
          {error}
        </p>
      )}

      <div className="rounded-lg bg-paper-50 border border-paper-200 p-4 text-sm">
        {items.map((i) => (
          <div key={i.product_id} className="flex justify-between py-0.5">
            <span className="text-ink-800">
              {i.quantity}× {i.name}
            </span>
            <span className="text-ink-950 font-medium">KES {(i.price_kes * i.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 mt-2 border-t border-paper-200 font-semibold text-ink-950">
          <span>Total</span>
          <span>KES {subtotal.toLocaleString()}</span>
        </div>
      </div>

      <Field label="Full name" name="customer_name" required />
      <Field label="M-Pesa phone number" name="customer_phone" required placeholder="07XXXXXXXX" />
      <Field label="Email (optional)" name="customer_email" type="email" />
      <div>
        <label htmlFor="delivery_address" className="block text-sm font-medium text-ink-950">
          Delivery address
        </label>
        <textarea id="delivery_address" name="delivery_address" required rows={2} className="field mt-1.5 h-auto py-3" />
      </div>
      {sites.length > 0 && (
        <div>
          <label htmlFor="site_id" className="block text-sm font-medium text-ink-950">
            Nearest SciFi site (optional)
          </label>
          <select id="site_id" name="site_id" className="field mt-1.5">
            <option value="">No preference</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? 'Starting checkout…' : `Pay KES ${subtotal.toLocaleString()} with M-Pesa`}
      </button>
    </form>
  );
}

function Field({ label, name, required, type = 'text', placeholder }: { label: string; name: string; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className="field mt-1.5" />
    </div>
  );
}
