'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

export interface AdminNotification {
  id: string;
  kind: 'contact' | 'ai' | 'content' | 'system' | (string & {});
  severity: 'info' | 'success' | 'warning' | 'critical' | (string & {});
  title: string;
  body: string | null;
  section: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

const LIMIT = 80;

function ping() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio not available — visual toast is enough */
  }
}

/**
 * Live admin notification feed. Loads recent rows, keeps them fresh through
 * Supabase Realtime (INSERT/UPDATE/DELETE), plays a soft ping on new alerts
 * and exposes mark-read / dismiss helpers. All mutations are optimistic.
 */
export function useAdminNotifications(enabled: boolean) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<AdminNotification | null>(null);
  const mounted = useRef(true);

  const unread = useMemo(() => notifications.reduce((acc, n) => acc + (n.read_at ? 0 : 1), 0), [notifications]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('[notifications] load failed:', error.message);
        setNotifications((data as AdminNotification[] | null) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel('admin-notifications-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
        const row = payload.new as AdminNotification;
        if (!mounted.current) return;
        setNotifications((prev) => [row, ...prev].slice(0, LIMIT));
        setToast(row);
        ping();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_notifications' }, (payload) => {
        const row = payload.new as AdminNotification;
        if (!mounted.current) return;
        setNotifications((prev) => prev.map((n) => (n.id === row.id ? row : n)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'admin_notifications' }, (payload) => {
        const old = payload.old as Partial<AdminNotification>;
        if (!mounted.current || !old?.id) return;
        setNotifications((prev) => prev.filter((n) => n.id !== old.id));
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [enabled, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const markRead = useCallback(async (id: string) => {
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? readAt } : n)));
    const { error } = await supabase.from('admin_notifications').update({ read_at: readAt }).eq('id', id).is('read_at', null);
    if (error) console.error('[notifications] markRead failed:', error.message);
  }, [supabase]);

  const markUnread = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: null } : n)));
    const { error } = await supabase.from('admin_notifications').update({ read_at: null }).eq('id', id);
    if (error) console.error('[notifications] markUnread failed:', error.message);
  }, [supabase]);

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: readAt })));
    const { error } = await supabase.from('admin_notifications').update({ read_at: readAt }).is('read_at', null);
    if (error) console.error('[notifications] markAllRead failed:', error.message);
  }, [supabase]);

  const remove = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
    if (error) console.error('[notifications] delete failed:', error.message);
  }, [supabase]);

  const clearRead = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.read_at));
    const { error } = await supabase.from('admin_notifications').delete().not('read_at', 'is', null);
    if (error) console.error('[notifications] clearRead failed:', error.message);
  }, [supabase]);

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    notifications,
    unread,
    loading,
    toast,
    dismissToast,
    markRead,
    markUnread,
    markAllRead,
    remove,
    clearRead,
  };
}

export type AdminNotificationsApi = ReturnType<typeof useAdminNotifications>;
