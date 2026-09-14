'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = { type: string; label: string; sub: string; href: string };

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cmd+K / Ctrl+K opens a full command-palette overlay from anywhere in
  // the admin, not just the inline search bar.
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [paletteOpen]);

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

  function goTo(href: string) {
    router.push(href);
    setOpen(false);
    setPaletteOpen(false);
    setQuery('');
  }

  return (
    <>
      <div ref={containerRef} className="relative max-w-md">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search…  (⌘K)"
          className="w-full border border-ink-950/15 bg-paper-50 px-3 py-1.5 text-sm focus:border-signal-500"
        />
        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 max-h-80 overflow-y-auto border border-ink-950/10 bg-paper-100 shadow-lg z-20">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => goTo(r.href)}
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

      {paletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24" onClick={() => setPaletteOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-paper-100 border border-ink-950/10 shadow-2xl">
            <input
              ref={paletteInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to a customer, ticket, agent, page…"
              className="w-full border-b border-ink-950/10 bg-transparent px-4 py-3.5 text-base focus:outline-none"
            />
            <div className="max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="p-4 text-sm text-ink-800/50">Type at least 2 characters to search.</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(r.href)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-paper-200/50 flex items-center justify-between border-b border-ink-950/5 last:border-0"
                  >
                    <span>
                      <span className="text-ink-950 font-medium">{r.label}</span>
                      {r.sub && <span className="text-ink-800/50 ml-2">{r.sub}</span>}
                    </span>
                    <span className="text-xs text-ink-800/40 uppercase tracking-wide">{r.type}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
