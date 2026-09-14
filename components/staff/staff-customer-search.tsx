'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Customer = { id: string; full_name: string; phone: string | null; email: string | null; estate_area: string | null; is_suspended: boolean };

export function StaffCustomerSearch({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState(initialCustomers);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.trim() === '') {
      setCustomers(initialCustomers);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/staff/customers?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (res.ok) setCustomers(json.customers);
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, phone, or email…"
        className="w-full max-w-md border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
      />
      <div className="mt-4 border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Area</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="p-3">
                  <Link href={`/staff/customers/${c.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                    {c.full_name}
                  </Link>
                </td>
                <td className="p-3 text-ink-800/70">{c.phone ?? c.email ?? '—'}</td>
                <td className="p-3 text-ink-800/70">{c.estate_area ?? '—'}</td>
                <td className="p-3">
                  {c.is_suspended ? <span className="text-status-bad">Suspended</span> : <span className="text-status-good">Active</span>}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
