'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Loader2, Save, Rocket, Undo2, CircleDot, Check, FileEdit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './toast';
import { FALLBACK_CONTENT } from '@/lib/fallback';
import type { HeroHomepage, SeoSettings, ThemeSettings } from '@/lib/types';

const inputClass = 'w-full rounded-xl border border-navy/12 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25';
const labelClass = 'mb-1.5 block font-mono text-[9px] uppercase tracking-[0.28em] text-ink/50';

function useDraftableSetting<T>(key: string, fallback: T) {
  const supabase = createClient();
  const toast = useToast();
  const [live, setLive] = useState<T>(fallback);
  const [draft, setDraft] = useState<T | null>(null);
  const [form, setForm] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('website_settings').select('value').eq('key', key).maybeSingle();
    const raw = (data as { value?: { live?: T; draft?: T | null } } | null)?.value;
    const liveValue = raw?.live ?? fallback;
    const draftValue = raw?.draft ?? null;
    setLive(liveValue);
    setDraft(draftValue);
    setForm(draftValue ?? liveValue);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const persist = async (value: { live: T; draft: T | null }, okMessage: string) => {
    setBusy(true);
    const { error } = await supabase.from('website_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) toast(`Save failed: ${error.message}`, 'error');
    else toast(okMessage, 'ok');
    setBusy(false);
    await load();
  };

  const saveDraft = () => persist({ live, draft: form }, 'Draft saved — the public site is unchanged until you publish.');
  const publish = () => persist({ live: form, draft: null }, 'Published — the live site now reflects this.');
  const discard = () => persist({ live, draft: null }, 'Draft discarded.');

  return { live, draft, form, setForm, loading, busy, saveDraft, publish, discard };
}

function EditorChrome({
  kicker, title, description, loading, busy, hasDraft, onSaveDraft, onPublish, onDiscard, children,
}: {
  kicker: string; title: string; description: string; loading: boolean; busy: boolean; hasDraft: boolean;
  onSaveDraft: () => void; onPublish: () => void; onDiscard: () => void; children: ReactNode;
}) {
  if (loading) {
    return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading…</div>;
  }
  return (
    <section className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">{kicker}</p>
          <h1 className="text-display mt-1 text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/60">{description}</p>
        </div>
        {hasDraft ? (
          <span className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-700"><CircleDot size={11} /> Unpublished changes</span>
        ) : (
          <span className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-700"><Check size={11} /> In sync with live site</span>
        )}
      </div>
      <div className="mt-5 rounded-3xl border border-navy/8 bg-white p-5 shadow-soft sm:p-7">{children}</div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button onClick={onSaveDraft} disabled={busy} className="flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition hover:border-electric hover:text-electric disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <FileEdit size={13} />} Save draft</button>
        <button onClick={onPublish} disabled={busy} className="btn-shine flex items-center gap-2 rounded-xl bg-electric px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-blue-600 disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />} Publish to live site</button>
        {hasDraft ? <button onClick={onDiscard} disabled={busy} className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-red-600 transition hover:bg-red-50 disabled:opacity-60"><Undo2 size={13} /> Discard draft</button> : null}
      </div>
    </section>
  );
}

/* ══════════ Homepage Editor ══════════ */
export function HomepageSection() {
  const { live, draft, form, setForm, loading, busy, saveDraft, publish, discard } = useDraftableSetting<HeroHomepage>('homepage', FALLBACK_CONTENT.homepage);
  return (
    <EditorChrome kicker="Site" title="Homepage Editor" description="The opening film of the site — eyebrow, the four headline beats, subline, calls to action and which scenes are shown. Draft → preview on the site only after publish." loading={loading} busy={busy} hasDraft={Boolean(draft)} onSaveDraft={saveDraft} onPublish={publish} onDiscard={discard}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className={labelClass}>Eyebrow line</span><input className={inputClass} value={form.heroEyebrow} onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })} /></label>
        {form.headline.map((line, i) => (
          <label key={i} className="block"><span className={labelClass}>Headline line {i + 1}</span><input className={`${inputClass} text-lg font-bold tracking-wide`} value={line} onChange={(e) => { const next = [...form.headline]; next[i] = e.target.value; setForm({ ...form, headline: next }); }} /></label>
        ))}
        <label className="block sm:col-span-2"><span className={labelClass}>Subline</span><textarea rows={3} className={inputClass} value={form.subline} onChange={(e) => setForm({ ...form, subline: e.target.value })} /></label>
        <label className="block"><span className={labelClass}>Primary CTA</span><input className={inputClass} value={form.ctaPrimary} onChange={(e) => setForm({ ...form, ctaPrimary: e.target.value })} /></label>
        <label className="block"><span className={labelClass}>Secondary CTA</span><input className={inputClass} value={form.ctaSecondary} onChange={(e) => setForm({ ...form, ctaSecondary: e.target.value })} /></label>
        <fieldset className="sm:col-span-2">
          <legend className={labelClass}>Scenes on the film</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(form.scenes).map(([scene, enabled]) => (
              <button key={scene} type="button" role="checkbox" aria-checked={enabled} onClick={() => setForm({ ...form, scenes: { ...form.scenes, [scene]: !enabled } })} className={`rounded-full border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.25em] transition ${enabled ? 'border-electric bg-mist text-electric' : 'border-navy/12 text-ink/40 line-through'}`}>{scene}</button>
            ))}
          </div>
        </fieldset>
      </div>
    </EditorChrome>
  );
}

/* ══════════ SEO Settings ══════════ */
export function SeoSection() {
  const { draft, form, setForm, loading, busy, saveDraft, publish, discard } = useDraftableSetting<SeoSettings>('seo', FALLBACK_CONTENT.seo);
  return (
    <EditorChrome kicker="Site" title="SEO Settings" description="Search engine metadata — server-rendered into every page, Open Graph and Twitter cards included." loading={loading} busy={busy} hasDraft={Boolean(draft)} onSaveDraft={saveDraft} onPublish={publish} onDiscard={discard}>
      <label className="block">
        <span className={labelClass}>Title · {form.title.length} chars</span>
        <input className={inputClass} value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label className="mt-4 block">
        <span className={labelClass}>Description · {form.description.length} chars</span>
        <textarea rows={3} className={inputClass} value={form.description} maxLength={200} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <label className="mt-4 block">
        <span className={labelClass}>Keywords (comma separated)</span>
        <textarea rows={3} className={`${inputClass} font-mono text-[12px]`} value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
      </label>
      <div className="mt-5 rounded-2xl border border-navy/8 bg-soft p-4">
        <p className="font-mono text-[8.5px] uppercase tracking-[0.35em] text-ink/45">Search result preview</p>
        <p className="mt-2 text-[13px] text-emerald-700">francis-platform.vercel.app</p>
        <p className="text-lg leading-snug text-[#1a0dab]">{form.title}</p>
        <p className="text-[12.5px] leading-snug text-ink/75">{form.description}</p>
      </div>
    </EditorChrome>
  );
}

/* ══════════ Theme Editor ══════════ */
const ACCENTS: Array<{ name: string; value: string }> = [
  { name: 'Electric Blue', value: '#2563EB' },
  { name: 'Royal Blue', value: '#1D4ED8' },
  { name: 'Azure Sky', value: '#0284C7' },
  { name: 'Indigo Pulse', value: '#4F46E5' },
  { name: 'Cyan Signal', value: '#0891B2' },
  { name: 'Deep Navy', value: '#071B3A' },
  { name: 'Teal Circuit', value: '#0F766E' },
];

export function ThemeSection() {
  const { draft, form, setForm, loading, busy, saveDraft, publish, discard } = useDraftableSetting<ThemeSettings>('theme', FALLBACK_CONTENT.theme);
  return (
    <EditorChrome kicker="Site" title="Theme Editor" description="The signature accent of the platform. The white-and-blue identity is sacred — variants stay inside the premium spectrum." loading={loading} busy={busy} hasDraft={Boolean(draft)} onSaveDraft={saveDraft} onPublish={publish} onDiscard={discard}>
      <p className={labelClass}>Accent system</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ACCENTS.map((accent) => {
          const selected = form.accent.toLowerCase() === accent.value.toLowerCase();
          return (
            <button key={accent.value} onClick={() => setForm({ ...form, accent: accent.value })} aria-pressed={selected} className={`group flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${selected ? 'border-electric/70 bg-mist shadow-glow' : 'border-navy/10 hover:border-electric/40'}`}>
              <span className="h-10 w-10 rounded-full border border-black/10 shadow-inner transition group-hover:scale-110" style={{ background: `linear-gradient(140deg, ${accent.value}, #071B3A)` }} />
              <span className="text-center font-mono text-[8px] uppercase leading-tight tracking-[0.2em] text-navy">{accent.name}</span>
              {selected ? <Check size={13} className="text-electric" /> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10">
        <div className="bg-navy p-5">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.4em] text-blue-300/80">Live preview</p>
          <p className="text-display mt-2 text-3xl font-bold text-white">THINK. <span style={{ color: form.accent }}>CREATE.</span> BUILD. <span className="text-outline">INNOVATE.</span></p>
          <button className="mt-3 rounded-full px-5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-white" style={{ background: form.accent }}>Sample CTA</button>
        </div>
        <div className="bg-white p-5">
          <p className="font-display text-sm font-bold text-navy">Body preview <span style={{ color: form.accent }}>— accent link</span></p>
          <p className="mt-1 text-sm text-ink/70">White surfaces, navy ink, glass cards, electric highlights. Typography: Space Grotesk + Inter + JetBrains Mono.</p>
        </div>
      </div>
    </EditorChrome>
  );
}
