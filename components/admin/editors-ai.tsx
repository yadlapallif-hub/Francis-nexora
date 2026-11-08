'use client';

import { useEffect, useState } from 'react';
import {
  Save, Loader2, SlidersHorizontal, CheckCircle2, AlertCircle, Download, Trash2,
  Lock, ChevronDown, ChevronUp, MessagesSquare, Globe2, ShieldAlert, Eye, EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './toast';
import type { AiSettings } from '@/lib/types';

const inputClass = 'w-full rounded-xl border border-navy/12 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25';
const labelClass = 'mb-1.5 block font-mono text-[9px] uppercase tracking-[0.28em] text-ink/50';

type EnvHealth = {
  aiKeyPresent: boolean; baseUrl: string; modelOverride: string | null;
  providerLabel: string; serviceRolePresent: boolean; searchProvider: string;
};

/* ══════════ AI Configuration ══════════ */
export function AiConfigSection() {
  const supabase = createClient();
  const toast = useToast();
  const [env, setEnv] = useState<EnvHealth | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/status').then((r) => (r.ok ? r.json() : null)).then(setEnv).catch(() => setEnv(null));
    supabase.from('ai_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) toast(`Could not load AI settings: ${error.message}`, 'error');
      setSettings(data as AiSettings | null);
    });
  }, [supabase, toast]);

  if (!settings) {
    return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading AI configuration…</div>;
  }

  const set = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => setSettings({ ...settings, [key]: value });
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('ai_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) toast(`Save failed: ${error.message}`, 'error');
    else toast('AI configuration saved.', 'ok');
    setSaving(false);
  };

  const uploads = settings.allowed_uploads ?? ['pdf', 'txt', 'docx'];
  const toggleUpload = (format: string) => {
    const next = uploads.includes(format) ? uploads.filter((f) => f !== format) : [...uploads, format];
    set('allowed_uploads', next.length ? next : uploads);
  };

  const envRow = (label: string, ok: boolean, detail: string) => (
    <li key={label} className="flex items-start gap-2.5 border-b border-navy/6 py-2.5 last:border-0">
      {ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />}
      <span className="min-w-0"><span className="block text-[12.5px] font-semibold text-navy">{label}</span><span className="break-words font-mono text-[9.5px] text-ink/55">{detail}</span></span>
    </li>
  );

  return (
    <section className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">FRANCIS AI</p>
          <h1 className="text-display mt-1 text-2xl font-bold text-navy">AI Configuration</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/60">Provider, behaviour, limits and knowledge. Provider credentials live only in server environment variables — never in the browser, never here.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-electric px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-blue-600 disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save configuration
        </button>
      </div>

      {/* Environment health */}
      <div className="mt-5 rounded-3xl border border-navy/8 bg-white p-6 shadow-soft">
        <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/55"><Globe2 size={13} className="text-electric" /> Server environment health</p>
        <ul className="mt-3 grid gap-x-6 md:grid-cols-2">
          {envRow('LLM API key (AI_API_KEY)', Boolean(env?.aiKeyPresent), env?.aiKeyPresent ? `Present · ${env?.providerLabel}` : 'Missing — FRANCIS AI answers with a standby notice until set')}
          {envRow('Provider base URL (AI_BASE_URL)', Boolean(env), env?.baseUrl ?? 'defaults to https://api.openai.com/v1')}
          {envRow('Model override (AI_MODEL)', Boolean(env?.modelOverride), env?.modelOverride ?? `Not set — using the panel's model below`)}
          {envRow('Service role key (server only)', Boolean(env?.serviceRolePresent), env?.serviceRolePresent ? 'Present — privileged routes healthy' : 'Missing — API routes will return 500')}
          {envRow('Web search', true, env?.searchProvider ?? 'DuckDuckGo built-in (set SERPER_API_KEY to upgrade)')}
          {envRow('Approved knowledge', true, 'Portfolio DB content is injected automatically — edit Profile/Projects/Skills to teach it')}
        </ul>
        {!env?.aiKeyPresent ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-snug text-amber-900">
            <strong>Enabling the model:</strong> in Vercel → Project → Settings → Environment Variables, add <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px]">AI_API_KEY</code> (and optionally <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px]">AI_BASE_URL</code>, <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px]">AI_MODEL</code>), then redeploy. Any OpenAI-compatible provider works — OpenAI, Groq, Together, OpenRouter, Ollama. No frontend changes required.
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* Behaviour */}
        <div className="rounded-3xl border border-navy/8 bg-white p-6 shadow-soft lg:col-span-3">
          <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/55"><SlidersHorizontal size={13} className="text-electric" /> Behaviour & limits</p>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-navy/8 bg-soft p-4">
            <div><p className="font-display text-sm font-bold text-navy">FRANCIS AI enabled</p><p className="text-[11px] text-ink/55">Master switch — when off, the chat shows a graceful standby message.</p></div>
            <button role="switch" aria-checked={settings.enabled} onClick={() => set('enabled', !settings.enabled)} className={`flex h-9 w-16 shrink-0 items-center rounded-full px-1 transition ${settings.enabled ? 'justify-end bg-emerald-500' : 'justify-start bg-navy/20'}`} aria-label="Toggle FRANCIS AI"><span className="h-7 w-7 rounded-full bg-white shadow" /></button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className={labelClass}>Provider (informational)</span><input className={inputClass} value={settings.provider} onChange={(e) => set('provider', e.target.value)} /></label>
            <label className="block sm:col-span-2"><span className={labelClass}>Model</span><input className={`${inputClass} font-mono text-[12px]`} value={settings.model} onChange={(e) => set('model', e.target.value)} placeholder="gpt-4o-mini" /></label>
            <label className="block"><span className={labelClass}>Max response tokens</span><input type="number" min={256} max={8192} className={inputClass} value={settings.max_response_tokens} onChange={(e) => set('max_response_tokens', Number(e.target.value))} /></label>
            <label className="block"><span className={labelClass}>Hourly request limit / user</span><input type="number" min={1} max={500} className={inputClass} value={settings.hourly_limit} onChange={(e) => set('hourly_limit', Number(e.target.value))} /></label>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-navy/8 p-4 sm:col-span-2">
              <div><p className="font-display text-sm font-bold text-navy">Live web research</p><p className="text-[11px] text-ink/55">Auto-searches the web for current questions; Research mode always searches. Citations included.</p></div>
              <button role="switch" aria-checked={settings.web_search} onClick={() => set('web_search', !settings.web_search)} className={`flex h-9 w-16 shrink-0 items-center rounded-full px-1 transition ${settings.web_search ? 'justify-end bg-electric' : 'justify-start bg-navy/20'}`} aria-label="Toggle web search"><span className="h-7 w-7 rounded-full bg-white shadow" /></button>
            </div>
            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>Accepted uploads</legend>
              <div className="flex gap-2">
                {(['pdf', 'txt', 'docx'] as const).map((format) => (
                  <button key={format} type="button" role="checkbox" aria-checked={uploads.includes(format)} onClick={() => toggleUpload(format)} className={`rounded-xl border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] transition ${uploads.includes(format) ? 'border-electric bg-mist text-electric' : 'border-navy/12 text-ink/40'}`}>{format}</button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Personality + welcome */}
        <div className="rounded-3xl border border-navy/8 bg-white p-6 shadow-soft lg:col-span-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/55">Personality & welcome</p>
          <label className="mt-3 block"><span className={labelClass}>System personality (server-side only)</span><textarea rows={9} className={`${inputClass} font-mono text-[11.5px] leading-relaxed`} value={settings.personality} onChange={(e) => set('personality', e.target.value)} /></label>
          <label className="mt-4 block"><span className={labelClass}>Welcome message (shown in empty chat)</span><textarea rows={3} className={inputClass} value={settings.welcome_message} onChange={(e) => set('welcome_message', e.target.value)} /></label>
        </div>
      </div>

      {/* Moderated content view */}
      <div className="mt-5 rounded-3xl border border-amber-300/60 bg-amber-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex max-w-2xl items-start gap-3">
            <ShieldAlert size={19} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-display text-sm font-bold text-amber-900">Moderated chat-content view <span className="font-mono text-[9px] uppercase tracking-[0.2em]">(off by default)</span></p>
              <p className="mt-1 text-[11.5px] leading-snug text-amber-900/85">Visitors&apos; conversations are private to their browser. Enabling this lets the admin read full message content in the Chat History section — a transparent, disclosed moderation capability. Leave off unless you have a real moderation need; metadata (titles, counts, dates) is always sufficient for operations.</p>
            </div>
          </div>
          <button role="switch" aria-checked={settings.allow_admin_content_view} onClick={() => set('allow_admin_content_view', !settings.allow_admin_content_view)} className={`flex h-9 w-16 shrink-0 items-center rounded-full px-1 transition ${settings.allow_admin_content_view ? 'justify-end bg-amber-500' : 'justify-start bg-navy/20'}`} aria-label="Toggle moderated content view"><span className="h-7 w-7 rounded-full bg-white shadow" /></button>
        </div>
      </div>
    </section>
  );
}

/* ══════════ AI Usage Analytics ══════════ */
export function AiAnalyticsSection() {
  const supabase = createClient();
  const [logs, setLogs] = useState<Array<{ created_at: string; tokens_in: number | null; tokens_out: number | null; latency_ms: number | null; error: string | null; mode: string | null; search_used: boolean | null }>>([]);
  const [totals, setTotals] = useState({ allTime: 0, errors: 0, stopped: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from('ai_usage_logs').select('created_at, tokens_in, tokens_out, latency_ms, error, mode, search_used').gt('created_at', since).order('created_at', { ascending: false }).limit(2000),
      supabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }),
      supabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }).not('error', 'is', null),
      supabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }).eq('error', 'stopped_by_user'),
    ]).then(([recent, all, errors, stopped]) => {
      setLogs(recent.data ?? []);
      setTotals({ allTime: all.count ?? 0, errors: errors.count ?? 0, stopped: stopped.count ?? 0 });
      setLoading(false);
    });
  }, [supabase]);

  const buckets = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: 0, tokens: 0 };
  });
  const bucketMap = new Map(buckets.map((b) => [b.key, b]));
  const modeCounts = new Map<string, number>();
  for (const row of logs) {
    const b = bucketMap.get(row.created_at.slice(0, 10));
    if (b) { b.count += 1; b.tokens += row.tokens_out ?? 0; }
    modeCounts.set(row.mode ?? 'general', (modeCounts.get(row.mode ?? 'general') ?? 0) + 1);
  }
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const totalTokens = logs.reduce((acc, r) => acc + (r.tokens_out ?? 0), 0);
  const recentErrors = logs.filter((l) => l.error).slice(0, 6);

  const exportCsv = () => {
    const header = 'created_at,mode,tokens_in,tokens_out,latency_ms,search_used,error';
    const lines = logs.map((l) => [l.created_at, l.mode ?? '', l.tokens_in ?? 0, l.tokens_out ?? 0, l.latency_ms ?? 0, l.search_used ? '1' : '0', (l.error ?? '').replace(/,/g, ';')].join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'francis-ai-usage-14d.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Crunching usage telemetry…</div>;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">FRANCIS AI</p>
          <h1 className="text-display mt-1 text-2xl font-bold text-navy">AI Usage Analytics</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/60">Real request telemetry from the last 14 days — volume, tokens, modes, errors and search pressure.</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-navy/15 px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-navy transition hover:border-electric hover:text-electric"><Download size={13} /> Export CSV</button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Requests · all time', value: totals.allTime.toLocaleString() },
          { label: 'Requests · 14 days', value: logs.length.toLocaleString() },
          { label: 'Tokens out · 14d', value: totalTokens.toLocaleString() },
          { label: 'Errors · all time', value: totals.errors.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-navy/8 bg-white p-4 shadow-soft sm:p-5">
            <p className="text-display text-2xl font-bold text-navy sm:text-3xl">{value}</p>
            <p className="mt-1 font-mono text-[8px] uppercase leading-relaxed tracking-[0.2em] text-ink/50">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="rounded-3xl border border-navy/8 bg-white p-6 shadow-soft lg:col-span-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/55">Requests per day</p>
          <div className="mt-4 flex h-44 items-end gap-1.5" role="img" aria-label="Requests per day, last 14 days">
            {buckets.map((day) => (
              <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-[9px] text-electric">{day.count}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-electric/50 to-electric" style={{ height: `${Math.max(2.5, (day.count / maxCount) * 100)}%` }} />
                <span className="w-full truncate text-center font-mono text-[6.5px] uppercase text-ink/35">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-navy/8 bg-white p-6 shadow-soft lg:col-span-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/55">Mode distribution</p>
          <ul className="mt-4 space-y-3">
            {[...modeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([mode, count]) => {
              const max = Math.max(...modeCounts.values());
              return (
                <li key={mode}>
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]"><span className="text-navy">{mode}</span><span className="text-ink/50">{count}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-electric" style={{ width: `${(count / max) * 100}%` }} /></div>
                </li>
              );
            })}
            {modeCounts.size === 0 ? <li className="text-sm text-ink/50">No requests in the window.</li> : null}
          </ul>
          <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-ink/35">Stopped by user · {totals.stopped}</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-navy/8 bg-white p-6 shadow-soft">
        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/55">Recent errors & warnings</p>
        {recentErrors.length === 0 ? <p className="mt-3 text-sm text-emerald-700">Clean run — no errors in the last 14 days.</p> : (
          <ul className="mt-3 divide-y divide-navy/6">
            {recentErrors.map((row, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5 font-mono text-[10.5px]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                <span className="min-w-0 flex-1 truncate uppercase tracking-[0.15em] text-navy">{row.mode ?? 'general'} · {row.error}</span>
                <span className="shrink-0 text-ink/40">{new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ══════════ Chat History (privacy-first moderation) ══════════ */
type SessionRow = { id: string; title: string; mode: string; created_at: string; updated_at: string };

export function ChatHistorySection() {
  const supabase = createClient();
  const toast = useToast();
  const [sessions, setSessions] = useState<Array<SessionRow & { message_count: number }>>([]);
  const [contentAllowed, setContentAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; created_at: string }>>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('chat_sessions').select('id, title, mode, created_at, updated_at').order('updated_at', { ascending: false }).limit(80),
      supabase.from('ai_settings').select('allow_admin_content_view').eq('id', 1).maybeSingle(),
    ]).then(async ([sessionsRes, settingsRes]) => {
      const rows = (sessionsRes.data ?? []) as SessionRow[];
      const ids = rows.map((r) => r.id);
      const counts = new Map<string, number>();
      if (ids.length) {
        const { data: msgs } = await supabase.from('chat_messages').select('session_id').in('session_id', ids).limit(5000);
        for (const m of msgs ?? []) counts.set(m.session_id as string, (counts.get(m.session_id as string) ?? 0) + 1);
      }
      setSessions(rows.map((r) => ({ ...r, message_count: counts.get(r.id) ?? 0 })));
      setContentAllowed(Boolean(settingsRes.data?.allow_admin_content_view));
      setLoading(false);
    });
  }, [supabase]);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    setMessages([]);
    setMessagesLoading(true);
    const { data, error } = await supabase.from('chat_messages').select('id, role, content, created_at').eq('session_id', id).order('created_at', { ascending: true }).limit(300);
    if (error) toast(`Content blocked by policy: ${error.message}`, 'error');
    setMessages((data as typeof messages | null) ?? []);
    setMessagesLoading(false);
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
    if (error) toast(`Delete failed: ${error.message}`, 'error');
    else { toast('Conversation deleted.', 'ok'); setSessions((prev) => prev.filter((s) => s.id !== id)); if (expanded === id) setExpanded(null); }
    setConfirmDelete(null);
  };

  if (loading) return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading conversation metadata…</div>;

  return (
    <section>
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">FRANCIS AI</p>
      <h1 className="text-display mt-1 text-2xl font-bold text-navy">Chat History Management</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink/60">Conversation metadata for operations and capacity planning. Message content stays private unless the moderated view is explicitly enabled in AI Configuration — that switch is surfaced, disclosed and off by default.</p>

      <div className={`mt-5 flex items-start gap-3 rounded-2xl border px-5 py-4 ${contentAllowed ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-navy/8 bg-white text-ink/70'}`}>
        {contentAllowed ? <Eye size={17} className="mt-0.5 shrink-0 text-amber-600" /> : <Lock size={17} className="mt-0.5 shrink-0 text-electric" />}
        <p className="text-[12px] leading-snug">
          {contentAllowed
            ? 'Moderated content view is ENABLED — message bodies below are visible to the administrator. Visitors were not explicitly notified of per-message review; disable this when moderation is not required.'
            : 'Moderated content view is OFF — message bodies are hidden by database policy. You see titles, modes, counts and timestamps only. Enable "Moderated chat-content view" in AI Configuration to change this.'}
        </p>
      </div>

      <ul className="mt-5 space-y-2">
        {sessions.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-navy/15 bg-white p-12 text-center"><MessagesSquare size={32} className="mx-auto text-electric/60" /><p className="text-display mt-3 text-lg font-bold text-navy">No conversations yet.</p><p className="mt-1 text-sm text-ink/60">Once visitors talk to FRANCIS AI, sessions will appear here.</p></li>
        ) : sessions.map((session) => (
          <li key={session.id} className="overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-soft">
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => contentAllowed && toggleExpand(session.id)} className="min-w-0 flex-1 text-left" aria-expanded={expanded === session.id} aria-label={contentAllowed ? 'Toggle content preview' : 'Content hidden by policy'}>
                <span className="block truncate text-[13px] font-semibold text-navy">{session.title}</span>
                <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink/45">{session.mode} · {session.message_count} messages · {new Date(session.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </button>
              {contentAllowed ? (
                <button onClick={() => toggleExpand(session.id)} className="rounded-lg p-2 text-ink/45 transition hover:text-navy" aria-label="Toggle content">{expanded === session.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
              ) : (
                <span className="rounded-lg p-2 text-ink/25" title="Enable moderated view to read content"><EyeOff size={15} /></span>
              )}
              {confirmDelete === session.id ? (
                <button onClick={() => deleteSession(session.id)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 font-mono text-[8px] font-bold uppercase text-red-600" title="Click to confirm deletion"><Trash2 size={13} /></button>
              ) : (
                <button onClick={() => setConfirmDelete(session.id)} className="rounded-lg p-2 text-ink/40 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete conversation"><Trash2 size={15} /></button>
              )}
            </div>
            {contentAllowed && expanded === session.id ? (
              <div className="max-h-80 space-y-3 overflow-y-auto border-t border-navy/6 bg-soft/60 p-4">
                {messagesLoading ? <p className="flex items-center gap-2 font-mono text-[10px] uppercase text-ink/50"><Loader2 size={13} className="animate-spin" /> Loading messages…</p> : messages.length === 0 ? <p className="text-xs text-ink/55">This session has no messages.</p> : messages.map((msg) => (
                  <div key={msg.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[12.5px] leading-relaxed ${msg.role === 'user' ? 'ml-auto bg-navy text-blue-50' : 'bg-white text-ink/90 border border-navy/8'}`}>
                    <p className="mb-1 font-mono text-[7.5px] uppercase tracking-[0.3em] opacity-60">{msg.role} · {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    {msg.content}
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
