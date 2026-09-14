'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Notification = { id: string; title: string; body: string; is_read: boolean; created_at: string };

export function NotificationBell({ variant = 'default' }: { variant?: 'default' | 'dark' }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, is_read, created_at')
        .eq('app_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data ?? []);

      // Only subscribe to changes scoped to this specific user's own
      // notifications — not the whole table — so this stays cheap and never
      // leaks other people's notification content over the wire.
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `app_user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
          }
        )
        .subscribe();
    }

    init();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        aria-label="Notifications"
        className={`relative p-1.5 ${variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-ink-800 hover:text-signal-500'}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 8a6 6 0 0112 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-status-bad text-white text-[10px] leading-4 text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto border border-ink-950/10 bg-paper-100 shadow-lg z-30">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-ink-800/60">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 border-b border-ink-950/5">
                <p className="text-sm font-medium text-ink-950">{n.title}</p>
                <p className="text-sm text-ink-800/70">{n.body}</p>
                <p className="mt-1 text-xs text-ink-800/40">
                  {new Date(n.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
