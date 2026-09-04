'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = { type: string; label: string; sub: string; href: string };

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.results ?? []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div ref={containerRef} className="relative max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search customers, tickets, staff, inventory…"
        className="w-full border border-ink-950/15 bg-paper-50 px-3 py-1.5 text-sm focus:border-signal-500"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 max-h-80 overflow-y-auto border border-ink-950/10 bg-paper-100 shadow-lg z-20">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                router.push(r.href);
                setOpen(false);
                setQuery('');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper-200/50 flex items-center justify-between"
            >
              <span>
                <span className="text-ink-950">{r.label}</span>
                {r.sub && <span className="text-ink-800/50 ml-2">{r.sub}</span>}
              </span>
              <span className="text-xs text-ink-800/40 uppercase tracking-wide">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
