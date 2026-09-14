'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  estate_area: string | null;
  is_agent: boolean;
  is_suspended: boolean;
  sites: { name: string } | { name: string }[] | null;
};

export function CustomerSearch({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.trim() === '') {
      setCustomers(initialCustomers);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (res.ok) setCustomers(json.customers);
      } finally {
        setLoading(false);
      }
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
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {customers.map((c) => {
              const site = Array.isArray(c.sites) ? c.sites[0] : c.sites;
              return (
                <tr key={c.id}>
                  <td className="p-3">
                    <Link href={`/wp-admin/customers/${c.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                      {c.full_name}
                    </Link>
                    {c.is_agent && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-signal-500/10 text-signal-500 rounded-sm">Agent</span>
                    )}
                  </td>
                  <td className="p-3 text-ink-800/70">{c.phone ?? c.email ?? '—'}</td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                  <td className="p-3">
                    {c.is_suspended ? (
                      <span className="text-status-bad">Suspended</span>
                    ) : (
                      <span className="text-status-good">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && !loading && (
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
