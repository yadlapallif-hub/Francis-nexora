'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { PanelCard } from './shared';
import type { AdminNotificationsApi, AdminNotification } from '@/lib/useAdminNotifications';
import {
  Mail, Cpu, FileText, Info, ShieldAlert, CircleCheck, TriangleAlert, Trash2,
  Check, CheckCheck, Loader2, BellOff, Inbox, ExternalLink, CircleDot,
} from 'lucide-react';

const KIND_ICON = {
  contact: Mail,
  ai: Cpu,
  content: FileText,
  system: Info,
} as const;

const SEVERITY_STYLE: Record<string, { chip: string; dot: string; icon: typeof Info }> = {
  info: { chip: 'bg-skylight text-navy border-electric/30', dot: 'bg-electric', icon: Info },
  success: { chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', icon: CircleCheck },
  warning: { chip: 'bg-amber-50 text-amber-900 border-amber-200', dot: 'bg-amber-500', icon: TriangleAlert },
  critical: { chip: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-600', icon: ShieldAlert },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function severityOf(n: AdminNotification) {
  return SEVERITY_STYLE[n.severity] ?? SEVERITY_STYLE.info;
}

function kindIcon(n: AdminNotification) {
  return KIND_ICON[n.kind as keyof typeof KIND_ICON] ?? Info;
}

export function NotificationsPanel({ api, onNavigate }: { api: AdminNotificationsApi; onNavigate: (section: string) => void }) {
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const { notifications, unread, loading, markRead, markUnread, markAllRead, remove, clearRead } = api;

  const filtered = useMemo(
    () => (tab === 'all' ? notifications : notifications.filter((n) => !n.read_at)),
    [notifications, tab]
  );

  return (
    <PanelCard
      title="Notifications & Alerts"
      description="Everything that happened on the public site — contact messages, AI failures — delivered here in realtime. Nothing arrives by email; the studio is the inbox."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => void markAllRead()}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3.5 py-2 text-[9.5px] font-bold uppercase tracking-[0.2em] text-navy transition enabled:hover:border-electric enabled:hover:text-electric disabled:opacity-35"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
          <button
            onClick={() => void clearRead()}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3.5 py-2 text-[9.5px] font-bold uppercase tracking-[0.2em] text-navy transition hover:border-red-500 hover:text-red-600"
          >
            <Trash2 size={12} /> Clear read
          </button>
        </div>
      }
    >
      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-navy/8 pb-4">
        {([
          { id: 'all', label: `All · ${notifications.length}` },
          { id: 'unread', label: `Unread · ${unread}` },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-4 py-2 text-[9.5px] font-bold uppercase tracking-[0.22em] transition',
              tab === t.id ? 'bg-navy text-white' : 'text-ink/55 hover:text-navy'
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-navy/60">
          <Loader2 size={18} className="animate-spin" /> Loading alerts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          {tab === 'unread'
            ? <CircleCheck size={34} className="text-emerald-500" />
            : <BellOff size={34} className="text-ink/25" />}
          <p className="mt-4 font-display text-lg font-bold text-navy">
            {tab === 'unread' ? 'All caught up.' : 'Nothing here yet.'}
          </p>
          <p className="mt-1 max-w-xs text-[12px] leading-5 text-ink/55">
            {tab === 'unread'
              ? 'Every alert has been read. New events will appear here instantly.'
              : 'When a visitor sends a message from the contact form or FRANCIS AI hits an error, an alert lands right here.'}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((n) => {
            const KindIcon = kindIcon(n);
            const sev = severityOf(n);
            const isUnread = !n.read_at;
            return (
              <li
                key={n.id}
                className={cn(
                  'group flex items-start gap-3 rounded-2xl border p-4 transition',
                  isUnread
                    ? 'border-electric/35 bg-skylight/60 shadow-[0_2px_14px_-8px_rgba(220,38,38,0.45)]'
                    : 'border-navy/8 bg-white'
                )}
              >
                <span className={cn('mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', sev.chip)}>
                  <KindIcon size={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnread && <CircleDot size={10} className="shrink-0 fill-electric text-electric" aria-label="Unread" />}
                    <p className="text-[13px] font-bold leading-snug text-navy">{n.title}</p>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.25em] text-ink/40">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body ? (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink/65">{n.body}</p>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => { void markRead(n.id); onNavigate(n.section || 'overview'); }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-electric"
                    >
                      Open {n.section === 'messages' ? 'inbox' : n.section === 'ai-analytics' ? 'AI analytics' : 'section'} <ExternalLink size={10} />
                    </button>
                    <button
                      onClick={() => (isUnread ? void markRead(n.id) : void markUnread(n.id))}
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                      className="inline-flex items-center gap-1.5 rounded-full border border-navy/12 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-ink/60 transition hover:border-electric hover:text-electric"
                    >
                      {isUnread ? <Check size={10} /> : <CircleDot size={10} />} {isUnread ? 'Mark read' : 'Mark unread'}
                    </button>
                    <button
                      onClick={() => void remove(n.id)}
                      title="Delete alert"
                      className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-ink/35 transition hover:border-red-200 hover:text-red-600"
                      aria-label="Delete alert"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
}

export function NotificationsEmptyHint() {
  return (
    <div className="flex items-center gap-2 text-ink/45">
      <Inbox size={13} /> Alerts appear here in realtime.
    </div>
  );
}
