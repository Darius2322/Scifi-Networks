'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OrderStatusButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function setStatus(status: 'fulfilled' | 'cancelled') {
    setSubmitting(true);
    await fetch(`/api/admin/product-orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-x-3 whitespace-nowrap">
      <button
        onClick={() => setStatus('fulfilled')}
        disabled={submitting}
        className="text-signal-500 hover:text-signal-600"
      >
        Mark fulfilled
      </button>
      <button
        onClick={() => setStatus('cancelled')}
        disabled={submitting}
        className="text-status-bad hover:opacity-80"
      >
        Cancel
      </button>
    </div>
  );
}
