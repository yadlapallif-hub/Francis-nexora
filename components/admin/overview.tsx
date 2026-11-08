'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban, Inbox, Bot, Cpu, ArrowRight, ExternalLink, CheckCircle2, AlertCircle,
  Activity, Loader2, Rocket, Search as SearchIcon, Zap, Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type EnvHealth = {
  aiKeyPresent: boolean; baseUrl: string; providerLabel: string;
  serviceRolePresent: boolean; searchProvider: string;
};
type MsgPreview = { id: string; name: string; subject: string | null; status: string; created_at: string };
type UsageRow = { created_at: string; tokens_in: number | null; tokens_out: number | null; latency_ms: number | null; error: string | null; mode: string | null; search_used: boolean | null };

export default function Overview({ onNavigate }: { onNavigate: (section: string) => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ projects: 0, skills: 0, unread: 0, aiWeek: 0, sessions: 0 });
  const [usage14, setUsage14] = useState<Array<{ day: string; label: string; count: number }>>([]);
  const [usageTotals, setUsageTotals] = useState({ tokensIn: 0, tokensOut: 0, errors: 0, avgLatency: 0, searches: 0 });
  const [recentMessages, setRecentMessages] = useState<MsgPreview[]>([]);
  const [recentAi, setRecentAi] = useState<UsageRow[]>([]);
  const [env, setEnv] = useState<EnvHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [projects, skills, unread, sessions, msgs, logsRes, aiLogs] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id, name, subject, status, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('ai_usage_logs').select('created_at, tokens_in, tokens_out, latency_ms, error, mode, search_used').order('created_at', { ascending: false }).limit(400),
        fetch('/api/admin/status').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (cancelled) return;
      const logs = (logsRes.data ?? []) as UsageRow[];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const buckets = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        return { day: key, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: 0 };
      });
      const bucketMap = new Map(buckets.map((b) => [b.day, b]));
      let tokensIn = 0, tokensOut = 0, errors = 0, searches = 0, latencySum = 0, latencyN = 0, aiWeek = 0;
      for (const row of logs) {
        const key = row.created_at.slice(0, 10);
        const bucket = bucketMap.get(key);
        if (bucket) bucket.count += 1;
        tokensIn += row.tokens_in ?? 0;
        tokensOut += row.tokens_out ?? 0;
        if (row.error) errors += 1;
        if (row.search_used) searches += 1;
        if (typeof row.latency_ms === 'number') { latencySum += row.latency_ms; latencyN += 1; }
        if (new Date(row.created_at).getTime() >= weekAgo) aiWeek += 1;
      }
      setCounts({ projects: projects.count ?? 0, skills: skills.count ?? 0, unread: unread.count ?? 0, aiWeek, sessions: sessions.count ?? 0 });
      setUsage14(buckets);
      setUsageTotals({ tokensIn, tokensOut, errors, avgLatency: latencyN ? Math.round(latencySum / latencyN) : 0, searches });
      setRecentMessages((msgs.data ?? []) as MsgPreview[]);
      setRecentAi(logs.slice(0, 7));
      setEnv(aiLogs as EnvHealth | null);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const maxCount = Math.max(1, ...usage14.map((d) => d.count));

  if (loading) {
    return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={18} className="animate-spin text-electric" /> Assembling the cockpit…</div>;
  }

  const statCards = [
    { label: 'Published projects', value: counts.projects, icon: FolderKanban, action: () => onNavigate('projects') },
    { label: 'New messages', value: counts.unread, icon: Inbox, action: () => onNavigate('messages'), alert: counts.unread > 0 },
    { label: 'AI requests · 7 days', value: counts.aiWeek, icon: Bot, action: () => onNavigate('ai-analytics') },
    { label: 'Skills listed', value: counts.skills, icon: Cpu, action: () => onNavigate('skills') },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">Cockpit</p>
          <h1 className="text-display mt-1.5 text-2xl font-bold text-navy sm:text-3xl">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-ink/60">Everything happening across FRANCIS — content, inbox and intelligence.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#0d2952]"><ExternalLink size={13} /> Open the live site</a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, action, alert }) => (
          <button key={label} onClick={action} className="group rounded-2xl border border-navy/8 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-electric/40 hover:shadow-card sm:p-5">
            <span className="flex items-center justify-between gap-2">
              <Icon size={17} className="text-electric" />
              {alert ? <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-red-500" aria-label="Needs attention" /> : null}
            </span>
            <span className="text-display mt-3 block text-3xl font-bold text-navy sm:text-4xl">{value}</span>
            <span className="mt-1 block font-mono text-[8.5px] uppercase leading-relaxed tracking-[0.2em] text-ink/50">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* Usage chart */}
        <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-soft xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/50"><Activity size={13} className="text-electric" /> FRANCIS AI · 14-day traffic</p>
            <button onClick={() => onNavigate('ai-analytics')} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-electric transition hover:text-navy">Full analytics <ArrowRight size={11} /></button>
          </div>
          <div className="mt-5 flex h-36 items-end gap-1.5 sm:gap-2.5" role="img" aria-label="AI requests per day for the last 14 days">
            {usage14.map((day) => (
              <div key={day.day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-[9px] text-electric opacity-0 transition group-hover:opacity-100">{day.count}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-electric/55 to-electric transition-all duration-500" style={{ height: `${Math.max(3, (day.count / maxCount) * 100)}%` }} />
                <span className="w-full truncate text-center font-mono text-[7px] uppercase text-ink/35">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-navy/6 pt-4 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ink/50">
            <span className="flex items-center gap-1.5"><Zap size={11} className="text-electric" /> Tokens in {usageTotals.tokensIn.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><Zap size={11} className="text-electric" /> Tokens out {usageTotals.tokensOut.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><SearchIcon size={11} className="text-electric" /> Live-search hits {usageTotals.searches}</span>
            <span className="flex items-center gap-1.5"><Clock size={11} className="text-electric" /> Avg latency {usageTotals.avgLatency}ms</span>
            <span className="flex items-center gap-1.5"><AlertCircle size={11} className={usageTotals.errors ? 'text-red-500' : 'text-emerald-600'} /> Errors {usageTotals.errors}</span>
          </div>
        </div>

        {/* Environment health */}
        <div className="rounded-2xl border border-navy/8 bg-navy p-5 text-white shadow-soft xl:col-span-2">
          <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-blue-300/80"><Rocket size={13} /> Systems check</p>
          <ul className="mt-4 space-y-3 text-[12.5px]">
            {[
              { ok: true, label: 'Database · Supabase Postgres', detail: 'RLS enforced · admin allowlist active' },
              { ok: Boolean(env?.serviceRolePresent), label: 'Service role (server only)', detail: 'Privileged API routes' },
              { ok: Boolean(env?.aiKeyPresent), label: 'LLM provider key', detail: env?.aiKeyPresent ? `${env.providerLabel} · key present` : 'Not set — FRANCIS AI on standby' },
              { ok: true, label: 'Web search', detail: env?.searchProvider ?? 'DuckDuckGo (built-in)' },
            ].map(({ ok, label, detail }) => (
              <li key={label} className="flex items-start gap-2.5">
                {ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" /> : <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />}
                <span><span className="block font-semibold text-blue-50">{label}</span><span className="block text-[11px] text-blue-200/65">{detail}</span></span>
              </li>
            ))}
          </ul>
          <button onClick={() => onNavigate('ai-config')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-electric/50 bg-electric/15 px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-blue-100 transition hover:bg-electric hover:text-white">Configure FRANCIS AI <ArrowRight size={12} /></button>
        </div>
      </div>

      {/* Latest messages + recent AI activity */}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/50"><Inbox size={13} className="text-electric" /> Latest contact messages</p>
            <button onClick={() => onNavigate('messages')} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-electric hover:text-navy">Inbox <ArrowRight size={11} /></button>
          </div>
          <ul className="mt-3 divide-y divide-navy/6">
            {recentMessages.length === 0 ? <li className="py-5 text-center text-sm text-ink/50">No messages yet — the contact scene is live and ready.</li> : recentMessages.map((msg) => (
              <li key={msg.id} className="flex items-center gap-3 py-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${msg.status === 'new' ? 'bg-electric' : 'bg-navy/20'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-navy">{msg.name}{msg.subject ? ` — ${msg.subject}` : ''}</span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ink/40">{new Date(msg.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] ${msg.status === 'new' ? 'bg-mist text-electric' : 'bg-soft text-ink/45'}`}>{msg.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/50"><Bot size={13} className="text-electric" /> Recent AI activity</p>
            <button onClick={() => onNavigate('chat-history')} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-electric hover:text-navy">Moderation <ArrowRight size={11} /></button>
          </div>
          <ul className="mt-3 divide-y divide-navy/6">
            {recentAi.length === 0 ? <li className="py-5 text-center text-sm text-ink/50">No AI traffic logged yet — ask FRANCIS AI something on the site.</li> : recentAi.map((row, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${row.error ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-navy">{row.mode ?? 'general'}{row.error ? ` · ${row.error}` : ''}</span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink/40">{new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </span>
                <span className="text-right font-mono text-[8.5px] text-ink/45">{row.tokens_out ?? 0} tok<br />{row.latency_ms ?? 0}ms</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-navy/6 pt-3 text-center font-mono text-[8.5px] uppercase tracking-[0.3em] text-ink/35">{counts.sessions} conversations · privacy-first moderation</p>
        </div>
      </div>
      <p className="text-center font-mono text-[8px] uppercase tracking-[0.4em] text-ink/30">FRANCIS Control Studio · changes publish straight to the live site · <Link href="/ai" className="underline underline-offset-2 hover:text-electric">Open FRANCIS AI</Link></p>
    </section>
  );
}
