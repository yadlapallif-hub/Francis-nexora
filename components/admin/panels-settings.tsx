'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { cn } from '@/lib/cn';
import { PanelCard, Field, INPUT, Toggle } from './shared';
import type { ThemeSettings, HomepageSettings, SeoSettings } from '@/lib/types';
import {
  Loader2, Save, Rocket, RotateCcw, Check, Palette, AlertTriangle, Cpu,
  Globe2, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, ShieldAlert, Search,
} from 'lucide-react';

/* ─── Draft → Publish envelope machinery ─────────────────────────────────── */

interface Envelope<T> { live: T; draft: T | null }

function useEnvelope<T>(key: string, defaults: T) {
  const supabase = getBrowserSupabase();
  const [envelope, setEnvelope] = useState<Envelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'save' | 'publish' | 'discard' | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('website_settings').select('value').eq('key', key).maybeSingle().then(({ data, error }) => {
      if (error) setError(error.message);
      const value = (data?.value ?? {}) as Partial<Envelope<T>> & Record<string, unknown>;
      const live = { ...defaults, ...(value.live as T ?? {}) };
      const draft = value.draft ? { ...defaults, ...(value.draft as T) } : null;
      setEnvelope({ live, draft });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const editing = envelope?.draft ?? envelope?.live ?? null;

  const patch = (p: Partial<T>) => {
    setEnvelope((env) => (env ? { ...env, draft: { ...(env.draft ?? env.live), ...p } } : env));
  };

  const write = async (next: Envelope<T>, action: 'save' | 'publish' | 'discard', message: string) => {
    setBusy(action);
    setError(null);
    const { error } = await supabase.from('website_settings').upsert({ key, value: next });
    if (error) setError(error.message);
    else {
      setEnvelope(next);
      setFlash(message);
      window.setTimeout(() => setFlash(null), 2000);
    }
    setBusy(null);
  };

  const saveDraft = () => envelope && write({ ...envelope, draft: envelope.draft ?? envelope.live }, 'save', 'Draft saved — not yet live.');
  const publish = () => envelope && write({ live: envelope.draft ?? envelope.live, draft: null }, 'publish', 'Published — changes are now live.');
  const discard = () => envelope && write({ ...envelope, draft: null }, 'discard', 'Draft discarded.');

  return { envelope, editing, patch, loading, busy, flash, error, saveDraft, publish, discard, isDirty: !!envelope?.draft };
}

function DraftBar({ isDirty, busy, flash, error, onSave, onPublish, onDiscard }: {
  isDirty: boolean;
  busy: string | null;
  flash: string | null;
  error: string | null;
  onSave: () => void;
  onPublish: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 border-t border-navy/10 bg-white/95 px-6 py-3 backdrop-blur">
      {error && <p className="mb-2 text-[11px] font-medium text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cn('inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em]', isDirty ? 'text-amber-600' : 'text-emerald-600')}>
          <span className={cn('h-2 w-2 rounded-full', isDirty ? 'bg-amber-500' : 'bg-emerald-500')} />
          {isDirty ? 'Unpublished changes' : 'Everything live'}
          {flash && <span className="ml-2 text-emerald-600 normal-case tracking-normal">· {flash}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onDiscard} disabled={!isDirty || busy !== null} className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-navy/70 transition enabled:hover:border-navy disabled:opacity-40"><RotateCcw size={12} /> Discard</button>
          <button onClick={onSave} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg border border-electric/50 bg-skylight px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-navy transition hover:border-electric disabled:opacity-40">{busy === 'save' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save draft</button>
          <button onClick={onPublish} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-electric px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#c00500] disabled:opacity-40">{busy === 'publish' ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />} Publish</button>
        </div>
      </div>
    </div>
  );
}

const THEME_DEFAULTS: ThemeSettings = { accent: '#E10600', mode: 'light' };

/* ═══════════ 12 · THEME EDITOR ═══════════ */

const ACCENTS = [
  { name: 'Electric Blue', value: '#E10600' },
  { name: 'Royal Indigo', value: '#c00500' },
  { name: 'Cyan Pulse', value: '#0891B2' },
  { name: 'Emerald Signal', value: '#059669' },
  { name: 'Crimson Forge', value: '#DC2626' },
];

export function ThemePanel() {
  const { editing, patch, loading, busy, flash, error, saveDraft, publish, discard, isDirty } = useEnvelope<ThemeSettings>('theme', THEME_DEFAULTS);
  if (loading || !editing) return <LoadingBox />;
  return (
    <PanelCard title="Website Theme Editor" description="Accent system for FRANCIS — applied to buttons, highlights, charts and the assistant. Draft first, publish when ready.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60"><Palette size={11} /> Accent</p>
          <div className="space-y-2">
            {ACCENTS.map((accent) => (
              <button key={accent.value} onClick={() => patch({ accent: accent.value })}
                className={cn('flex w-full items-center justify-between rounded-xl border px-4 py-3 transition', editing.accent === accent.value ? 'border-electric bg-skylight ring-2 ring-electric/25' : 'border-navy/10 hover:border-navy/30')}
                aria-pressed={editing.accent === accent.value}>
                <span className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full shadow-inner" style={{ background: accent.value }} />
                  <span className="text-[12px] font-semibold text-navy">{accent.name}</span>
                </span>
                <code className="font-mono text-[10px] text-ink/50">{accent.value}</code>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Mode</p>
          <div className="grid gap-2">
            {(['light', 'dark'] as const).map((mode) => (
              <button key={mode} onClick={() => patch({ mode })} disabled={mode === 'dark'}
                className={cn('rounded-xl border px-4 py-4 text-left transition', editing.mode === mode ? 'border-electric bg-skylight' : 'border-navy/10', mode === 'dark' && 'cursor-not-allowed opacity-45')}>
                <span className="block text-[12px] font-bold uppercase tracking-widest text-navy">{mode === 'light' ? 'Premium White' : 'Deep Navy (soon)'}</span>
                <span className="mt-1 block text-[10.5px] text-ink/50">{mode === 'light' ? 'The signature FRANCIS identity — white canvas, electric blue, deep navy.' : 'Cinematic dark mode ships after the light system is finalized.'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <DraftBar isDirty={isDirty} busy={busy} flash={flash} error={error} onSave={saveDraft} onPublish={publish} onDiscard={discard} />
    </PanelCard>
  );
}

/* ═══════════ 13 · HOMEPAGE EDITOR ═══════════ */

const HOMEPAGE_DEFAULTS: HomepageSettings = {
  heroEyebrow: 'PORTFOLIO · AI WORKSPACE · STUDIO',
  headline: ['THINK.', 'CREATE.', 'BUILD.', 'INNOVATE.'],
  subline: "I'm Francis, an aspiring software engineer passionate about programming, technology, artificial intelligence, innovative digital products, and creating meaningful digital experiences.",
  ctaPrimary: 'Explore the work',
  ctaSecondary: 'Ask FRANCIS AI',
  scenes: { about: true, skills: true, education: true, projects: true, experience: true, contact: true },
};

const SCENE_LABELS: Array<{ key: keyof HomepageSettings['scenes']; label: string }> = [
  { key: 'about', label: 'Scene 03 — About' },
  { key: 'skills', label: 'Scene 04 — Technical Skills' },
  { key: 'education', label: 'Scene 05 — Education' },
  { key: 'projects', label: 'Scene 06 — Featured Projects' },
  { key: 'experience', label: 'Scene 07 — Experience & Achievements' },
  { key: 'contact', label: 'Scene 08 — Contact' },
];

export function HomepagePanel() {
  const { editing, patch, loading, busy, flash, error, saveDraft, publish, discard, isDirty } = useEnvelope<HomepageSettings>('homepage', HOMEPAGE_DEFAULTS);
  if (loading || !editing) return <LoadingBox />;
  const headline = editing.headline;
  return (
    <PanelCard title="Homepage Editor" description="The opening cut — eyebrow, the four-word manifesto, subline, CTAs and which story scenes render.">
      <div className="grid gap-4">
        <Field label="Eyebrow (above the headline)">
          <input className={INPUT} value={editing.heroEyebrow} onChange={(e) => patch({ heroEyebrow: e.target.value })} />
        </Field>
        <div>
          <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Headline — one giant word per line</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <input key={i} className={cn(INPUT, 'text-center font-display text-lg font-bold')} value={headline[i] ?? ''} onChange={(e) => {
                const next = [...headline];
                next[i] = e.target.value.toUpperCase();
                patch({ headline: next });
              }} />
            ))}
          </div>
        </div>
        <Field label="Subline / introduction">
          <textarea rows={3} className={cn(INPUT, 'leading-6')} value={editing.subline} onChange={(e) => patch({ subline: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary CTA"><input className={INPUT} value={editing.ctaPrimary} onChange={(e) => patch({ ctaPrimary: e.target.value })} /></Field>
          <Field label="Secondary CTA"><input className={INPUT} value={editing.ctaSecondary} onChange={(e) => patch({ ctaSecondary: e.target.value })} /></Field>
        </div>
        <div>
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Story scenes</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCENE_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-navy/10 px-4 py-3">
                <span className="text-[12px] font-semibold text-navy">{label}</span>
                <Toggle checked={editing.scenes[key] !== false} onChange={(v) => patch({ scenes: { ...editing.scenes, [key]: v } })} label={label} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <DraftBar isDirty={isDirty} busy={busy} flash={flash} error={error} onSave={saveDraft} onPublish={publish} onDiscard={discard} />
    </PanelCard>
  );
}

/* ═══════════ 14 · SEO SETTINGS ═══════════ */

const SEO_DEFAULTS: SeoSettings = {
  title: 'FRANCIS — Yadlapalli Francis | Aspiring Software Engineer & AI Builder',
  description: 'Yadlapalli Francis (FRANCIS) — aspiring software engineer from Visakhapatnam, India. Cinematic developer portfolio, general-purpose FRANCIS AI assistant, and live project showcase including NEXORA AGENT.',
  keywords: 'Yadlapalli Francis, Francis, FRANCIS, aspiring software engineer, Raghu Engineering College, B.Tech CSE, NEXORA AGENT, portfolio, AI assistant',
};

export function SeoPanel() {
  const { editing, patch, loading, busy, flash, error, saveDraft, publish, discard, isDirty } = useEnvelope<SeoSettings>('seo', SEO_DEFAULTS);
  if (loading || !editing) return <LoadingBox />;
  const counter = (text: string, max: number) => (
    <span className={cn('font-mono text-[9px]', text.length > max ? 'text-red-500' : 'text-ink/40')}>{text.length}/{max}</span>
  );
  return (
    <PanelCard title="SEO Settings" description="How FRANCIS appears to search engines and shared links — Open Graph and Twitter cards included.">
      <div className="grid gap-4">
        <Field label="Title" hint="~60 characters render best in search results.">
          <div className="relative">
            <input className={INPUT} value={editing.title} onChange={(e) => patch({ title: e.target.value })} />
            <span className="absolute right-3 top-3">{counter(editing.title, 65)}</span>
          </div>
        </Field>
        <Field label="Description" hint="~155 characters for the snippet under the title.">
          <div className="relative">
            <textarea rows={3} className={cn(INPUT, 'leading-6')} value={editing.description} onChange={(e) => patch({ description: e.target.value })} />
            <span className="absolute right-3 top-3">{counter(editing.description, 160)}</span>
          </div>
        </Field>
        <Field label="Keywords" hint="Comma-separated — still useful for some engines and internal search.">
          <textarea rows={2} className={cn(INPUT, 'leading-6')} value={editing.keywords} onChange={(e) => patch({ keywords: e.target.value })} />
        </Field>
        <div className="rounded-2xl border border-navy/10 bg-mist p-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60"><Search size={11} className="mr-1 inline" /> Search preview</p>
          <p className="mt-2 truncate text-[12px] text-[#E10600]">{editing.title}</p>
          <p className="text-[11px] text-emerald-800">https://francis-platform.vercel.app</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-ink/60">{editing.description}</p>
        </div>
      </div>
      <DraftBar isDirty={isDirty} busy={busy} flash={flash} error={error} onSave={saveDraft} onPublish={publish} onDiscard={discard} />
    </PanelCard>
  );
}

/* ═══════════ 15 · AI CONFIGURATION ═══════════ */

interface AiSettingsRow {
  id: number; enabled: boolean; provider: string; model: string; web_search: boolean;
  max_response_tokens: number; hourly_limit: number; allowed_uploads: string[];
  personality: string; welcome_message: string; allow_admin_content_view: boolean;
}

export function AiConfigPanel() {
  const supabase = getBrowserSupabase();
  const [form, setForm] = useState<AiSettingsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('ai_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) setError(error.message);
      if (data) setForm(data as AiSettingsRow);
    });
  }, [supabase]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('ai_settings').upsert(form);
    if (error) setError(error.message);
    else { setFlash(true); window.setTimeout(() => setFlash(false), 1800); }
    setSaving(false);
  };

  if (!form) return <LoadingBox />;
  const set = <K extends keyof AiSettingsRow>(key: K, value: AiSettingsRow[K]) => setForm({ ...form, [key]: value });
  const uploadOptions = ['pdf', 'txt', 'docx'];

  return (
    <PanelCard
      title="AI Configuration"
      description="Command deck for FRANCIS AI. Provider credentials never appear here — they live exclusively in server environment variables (Vercel → Settings → Environment Variables)."
      actions={<button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-electric px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#c00500]">{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save configuration</button>}
    >
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</p>}
      {flash && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-800">Saved. The assistant obeys these settings immediately.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-navy/10 bg-mist px-5 py-4">
          <div><p className="text-[13px] font-bold text-navy">FRANCIS AI enabled</p><p className="text-[10.5px] text-ink/55">Master switch for the public assistant.</p></div>
          <Toggle checked={form.enabled} onChange={(v) => set('enabled', v)} label="Enable FRANCIS AI" />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-navy/10 bg-mist px-5 py-4">
          <div><p className="flex items-center gap-1.5 text-[13px] font-bold text-navy"><Globe2 size={13} /> Web research</p><p className="text-[10.5px] text-ink/55">DuckDuckGo live search for fresh questions (no key needed). Serper/Bing keys optional via env.</p></div>
          <Toggle checked={form.web_search} onChange={(v) => set('web_search', v)} label="Enable web research" />
        </div>
        <Field label="Provider (OpenAI-compatible)">
          <input className={INPUT} value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="openai-compatible" />
        </Field>
        <Field label="Model">
          <input className={cn(INPUT, 'font-mono')} value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="gpt-4o-mini" />
        </Field>
        <Field label="Max response tokens">
          <input type="number" min={256} max={8192} className={INPUT} value={form.max_response_tokens} onChange={(e) => set('max_response_tokens', Number(e.target.value))} />
        </Field>
        <Field label="Hourly message limit per visitor">
          <input type="number" min={1} max={500} className={INPUT} value={form.hourly_limit} onChange={(e) => set('hourly_limit', Number(e.target.value))} />
        </Field>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Accepted upload formats</p>
        <div className="flex flex-wrap gap-2">
          {uploadOptions.map((ext) => {
            const on = form.allowed_uploads.includes(ext);
            return (
              <button key={ext} onClick={() => set('allowed_uploads', on ? form.allowed_uploads.filter((x) => x !== ext) : [...form.allowed_uploads, ext])}
                aria-pressed={on}
                className={cn('rounded-xl border px-5 py-3 font-mono text-[12px] font-bold uppercase transition', on ? 'border-electric bg-electric text-white' : 'border-navy/15 text-ink/50')}>
                .{ext}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Assistant personality / system brief" hint="How FRANCIS AI behaves. Francis facts always come from Profile, About, Education and Projects.">
          <textarea rows={5} className={cn(INPUT, 'font-mono text-[11.5px] leading-6')} value={form.personality} onChange={(e) => set('personality', e.target.value)} />
        </Field>
        <Field label="Welcome message (empty chat state)">
          <textarea rows={2} className={cn(INPUT, 'leading-6')} value={form.welcome_message} onChange={(e) => set('welcome_message', e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-amber-900"><ShieldAlert size={14} /> Moderation transparency switch</p>
            <p className="mt-1.5 max-w-xl text-[11.5px] leading-5 text-amber-900/85">
              Off by default. When ON, administrators can read conversation contents in Chat History — and the public should be told. Leave OFF to keep every conversation private; only message counts and metadata are visible.
            </p>
          </div>
          <Toggle checked={form.allow_admin_content_view} onChange={(v) => set('allow_admin_content_view', v)} label="Allow admins to view conversation content" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-navy/10 bg-skylight/50 p-4 text-[11px] leading-5 text-navy">
        <p className="flex items-center gap-2 font-bold"><Cpu size={13} /> Activating the AI (one time, ~2 minutes)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink/75">
          <li>Get an API key — e.g. platform.openai.com → API keys (any OpenAI-compatible provider works).</li>
          <li>Vercel → your project → Settings → Environment Variables → add <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">OPENAI_API_KEY</code> (and optionally <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">OPENAI_BASE_URL</code>, <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">AI_MODEL</code>).</li>
          <li>Redeploy. FRANCIS AI goes live instantly — general knowledge, research with citations, programming mentor, document Q&amp;A.</li>
        </ol>
      </div>
    </PanelCard>
  );
}

/* ═══════════ 16 · AI USAGE ANALYTICS ═══════════ */

interface UsageRow { created_at: string; mode: string | null; tokens_in: number | null; tokens_out: number | null; latency_ms: number | null; search_used: boolean; error: string | null }

export function AiAnalyticsPanel() {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<UsageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - 13 * 86400000).toISOString();
    supabase.from('ai_usage_logs').select('created_at, mode, tokens_in, tokens_out, latency_ms, search_used, error').gte('created_at', since).order('created_at', { ascending: false }).limit(1000)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows((data as UsageRow[]) ?? []);
      });
  }, [supabase]);

  const daily = useMemo(() => {
    const map = new Map<string, { count: number; errors: number; searches: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map.set(d.toISOString().slice(0, 10), { count: 0, errors: 0, searches: 0 });
    }
    for (const row of rows ?? []) {
      const key = row.created_at.slice(0, 10);
      const entry = map.get(key);
      if (entry) {
        entry.count += 1;
        if (row.error) entry.errors += 1;
        if (row.search_used) entry.searches += 1;
      }
    }
    return Array.from(map.entries());
  }, [rows]);

  if (error) return <PanelCard title="AI Usage Analytics"><p className="text-[12px] text-red-600">{error}</p></PanelCard>;
  if (!rows) return <LoadingBox />;

  const total = rows.length;
  const errors = rows.filter((r) => r.error).length;
  const searches = rows.filter((r) => r.search_used).length;
  const avgLatency = total ? Math.round(rows.reduce((a, r) => a + (r.latency_ms ?? 0), 0) / total) : 0;
  const tokensOut = rows.reduce((a, r) => a + (r.tokens_out ?? 0), 0);
  const peak = Math.max(1, ...daily.map(([, v]) => v.count));
  const recentErrors = rows.filter((r) => r.error).slice(0, 6);

  const stat = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-navy/10 bg-mist p-4 text-center">
      <p className="font-display text-2xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-ink/50">{label}</p>
    </div>
  );

  return (
    <PanelCard title="AI Usage Analytics" description="Last 14 days of FRANCIS AI activity — aggregate counts only; conversation contents stay private unless moderation is explicitly enabled.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stat('Requests', total)}
        {stat('Live searches', searches)}
        {stat('Avg latency', `${avgLatency}ms`)}
        {stat('Tokens out', tokensOut.toLocaleString())}
        {stat('Errors', errors)}
      </div>

      <div className="mt-6">
        <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Requests · last 14 days</p>
        <div className="flex h-36 items-end gap-1.5">
          {daily.map(([day, v]) => (
            <div key={day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[8.5px] text-ink/0 transition group-hover:text-ink/60">{v.count}</span>
              <div className={cn('w-full rounded-t-md transition-all', v.errors > 0 ? 'bg-gradient-to-t from-amber-500 to-amber-300' : 'bg-gradient-to-t from-electric to-[#ff8a7a]')} style={{ height: `${Math.max(3, (v.count / peak) * 100)}%` }} title={`${day}: ${v.count} req · ${v.searches} searches · ${v.errors} errors`} />
              <span className="font-mono text-[7.5px] uppercase text-ink/35">{day.slice(8, 10)}/{day.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </div>

      {recentErrors.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-red-500"><AlertTriangle size={11} /> Recent errors</p>
          <ul className="space-y-1.5">
            {recentErrors.map((row, i) => (
              <li key={i} className="truncate rounded-lg border border-red-100 bg-red-50 px-3 py-2 font-mono text-[10px] text-red-800" title={row.error ?? ''}>
                [{new Date(row.created_at).toLocaleString()}] {row.mode ?? 'general'} — {row.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelCard>
  );
}

/* ═══════════ 17 · CHAT HISTORY MANAGEMENT ═══════════ */

interface AdminSessionRow { id: string; owner_token: string; title: string; mode: string; updated_at: string; created_at: string }
interface AdminMessageRow { id: string; role: string; content: string; created_at: string }

export function ChatHistoryPanel() {
  const supabase = getBrowserSupabase();
  const [sessions, setSessions] = useState<AdminSessionRow[] | null>(null);
  const [contentAllowed, setContentAllowed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('ai_settings').select('allow_admin_content_view').eq('id', 1).maybeSingle().then(({ data }) => setContentAllowed(Boolean(data?.allow_admin_content_view)));
    supabase.from('chat_sessions').select('id, owner_token, title, mode, updated_at, created_at').order('updated_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) setError(error.message); setSessions((data as AdminSessionRow[]) ?? []); });
  }, [supabase]);

  const toggleExpand = async (id: string) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    setMessages([]);
    if (!contentAllowed) return;
    setLoadingMessages(true);
    const { data } = await supabase.from('chat_messages').select('id, role, content, created_at').eq('session_id', id).order('created_at', { ascending: true }).limit(200);
    setMessages((data as AdminMessageRow[]) ?? []);
    setLoadingMessages(false);
  };

  const deleteSession = async (id: string) => {
    setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    await supabase.from('chat_sessions').delete().eq('id', id);
    if (expanded === id) setExpanded(null);
  };

  const clearAll = async () => {
    await supabase.from('chat_sessions').delete().not('id', 'is', null);
    setSessions([]);
    setConfirmClear(false);
    setExpanded(null);
  };

  return (
    <PanelCard
      title="Chat History Management"
      description="Session metadata for moderation and abuse response. Content is gated by the transparency switch in AI Configuration — enforced at the database level, not just the UI."
      actions={!confirmClear ? (
        <button onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-600 transition hover:border-red-400 hover:bg-red-50"><Trash2 size={12} /> Clear all</button>
      ) : (
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">Delete every conversation?</span>
          <button onClick={clearAll} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white">Yes, delete all</button>
          <button onClick={() => setConfirmClear(false)} className="rounded-lg border border-navy/15 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-navy/70">Cancel</button>
        </span>
      )}
    >
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</p>}
      <div className={cn('mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-[11.5px] leading-5', contentAllowed ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900')}>
        {contentAllowed ? <Eye size={15} className="mt-0.5 shrink-0" /> : <EyeOff size={15} className="mt-0.5 shrink-0" />}
        <span><strong>{contentAllowed ? 'Conversation content visible to admins.' : 'Conversation content is private.'}</strong> {contentAllowed ? 'The transparency switch is ON — message bodies load below.' : 'Only metadata (title, mode, timestamps) is shown. Flip the switch in AI Configuration only with clear user notice.'}</span>
      </div>

      {!sessions ? (
        <div className="flex items-center justify-center gap-2 py-16 text-navy/60"><Loader2 size={18} className="animate-spin" /> Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy/20 py-14 text-center text-[13px] text-ink/50">No conversations recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id} className="overflow-hidden rounded-2xl border border-navy/10">
              <div className="flex items-center gap-3 bg-mist/70 px-4 py-3">
                <button onClick={() => toggleExpand(session.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={expanded === session.id}>
                  {expanded === session.id ? <ChevronUp size={14} className="shrink-0 text-navy/50" /> : <ChevronDown size={14} className="shrink-0 text-navy/50" />}
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-navy">{session.title}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink/40">{session.mode} · visitor {session.owner_token.slice(0, 8)}… · {new Date(session.updated_at).toLocaleString()}</span>
                  </span>
                </button>
                <button onClick={() => deleteSession(session.id)} className="rounded-lg p-2 text-ink/40 transition hover:bg-white hover:text-red-600" aria-label="Delete session"><Trash2 size={14} /></button>
              </div>
              {expanded === session.id && (
                <div className="max-h-96 overflow-y-auto border-t border-navy/10 bg-white p-4">
                  {!contentAllowed ? (
                    <p className="py-4 text-center text-[11px] uppercase tracking-[0.25em] text-ink/40">Content hidden — privacy switch is OFF</p>
                  ) : loadingMessages ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-ink/50"><Loader2 size={14} className="animate-spin" /> Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-ink/50">No messages stored in this session.</p>
                  ) : (
                    <ul className="space-y-3">
                      {messages.map((m) => (
                        <li key={m.id} className="text-[12px] leading-5">
                          <span className={cn('mb-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest', m.role === 'user' ? 'bg-navy text-white' : 'bg-skylight text-electric')}>{m.role}</span>
                          <p className="whitespace-pre-wrap text-ink/85">{m.content.slice(0, 2000)}{m.content.length > 2000 ? '…' : ''}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

function LoadingBox() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-3xl border border-navy/10 bg-white py-20 text-navy/60">
      <Loader2 size={18} className="animate-spin" /> Loading…
    </div>
  );
}
