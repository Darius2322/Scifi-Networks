'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SuspendCustomerButton({ customerId, isSuspended }: { customerId: string; isSuspended: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      isSuspended
        ? 'Reactivate this customer account?'
        : 'Suspend this customer account? They will be flagged as suspended across the system.'
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_suspended: !isSuspended }),
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className={`inline-flex items-center rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        isSuspended
          ? 'bg-status-good/10 text-status-good hover:bg-status-good/20'
          : 'bg-status-bad/10 text-status-bad hover:bg-status-bad/20'
      }`}
    >
      {isSuspended ? 'Reactivate account' : 'Suspend account'}
    </button>
  );
}
