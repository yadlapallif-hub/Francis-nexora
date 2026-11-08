'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Save, Loader2, Upload, FileText, Trash2, Mail, MailOpen, Archive, Inbox, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './toast';
import type { Profile } from '@/lib/types';

const inputClass = 'w-full rounded-xl border border-navy/12 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25';
const labelClass = 'mb-1.5 block font-mono text-[9px] uppercase tracking-[0.28em] text-ink/50';

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-').slice(0, 80);
}

/* ══════════ Profile Editor ══════════ */
export function ProfileEditor() {
  const supabase = createClient();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'resume' | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', 'francis').maybeSingle().then(({ data, error }) => {
      if (error) toast(`Could not load the profile: ${error.message}`, 'error');
      setProfile((data as Profile | null) ?? null);
    });
  }, [supabase, toast]);

  if (!profile) {
    return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading the profile…</div>;
  }

  const set = (key: keyof Profile, value: string) => setProfile({ ...profile, [key]: value });

  const save = async () => {
    setSaving(true);
    const { id, ...payload } = profile;
    const { error } = await supabase.from('profiles').update(payload).eq('id', 'francis');
    if (error) toast(`Save failed: ${error.message}`, 'error');
    else toast('Profile saved — live on the site.', 'ok');
    setSaving(false);
  };

  const upload = async (kind: 'avatar' | 'resume', file: File) => {
    setUploading(kind);
    try {
      const bucket = kind === 'avatar' ? 'media' : 'resume';
      const path = kind === 'avatar' ? `francis/${crypto.randomUUID()}-${safeFileName(file.name)}` : `francis-resume-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: kind === 'resume', cacheControl: '300' });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      set(kind === 'avatar' ? 'avatar_url' : 'resume_url', data.publicUrl);
      toast(kind === 'avatar' ? 'Portrait uploaded — save the profile to publish.' : 'Resume uploaded — link is live after saving.', 'ok');
    } catch (err) {
      toast(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
    } finally {
      setUploading(null);
    }
  };

  const field = (label: string, key: keyof Profile, placeholder = '', span2 = false) => (
    <label className={`block ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className={labelClass}>{label}</span>
      <input className={inputClass} value={String(profile[key] ?? '')} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} />
    </label>
  );

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">Content</p>
          <h1 className="text-display mt-1 text-2xl font-bold text-navy">Profile Editor</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/60">The identity of the platform — name, role, location, channels and the resume. Everything here renders on the public site.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-electric px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-blue-600 disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save profile
        </button>
      </div>

      <div className="rounded-3xl border border-navy/8 bg-white p-5 shadow-soft sm:p-7">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="Francis portrait" className="h-28 w-24 rounded-2xl border border-navy/10 object-cover" />
          ) : <div className="flex h-28 w-24 items-center justify-center rounded-2xl border border-dashed border-navy/20 text-[9px] uppercase text-ink/40">No portrait</div>}
          <div className="flex flex-wrap gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-navy/12 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric">
              {uploading === 'avatar' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload portrait
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload('avatar', f); }} />
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-navy/12 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric">
              {uploading === 'resume' ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Upload resume (PDF)
              <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload('resume', f); }} />
            </label>
            {profile.resume_url ? <a href={profile.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-700"><FileText size={13} /> Resume live ↗</a> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field('Full name', 'full_name')}
          {field('Display name', 'display_name')}
          {field('Professional title', 'title')}
          {field('Email', 'email', 'you@example.com')}
          {field('Education', 'education', 'B.Tech Computer Science and Engineering', true)}
          {field('College', 'college', 'Raghu Engineering College', true)}
          {field('Previous education', 'previous_education', 'Diploma in Computer Engineering', true)}
          {field('Location', 'location', 'Visakhapatnam, Andhra Pradesh, India', true)}
          {field('Instagram URL', 'instagram_url', 'https://instagram.com/…', true)}
          {field('GitHub URL', 'github_url', 'https://github.com/…')}
          {field('LinkedIn URL', 'linkedin_url', 'https://linkedin.com/in/…')}
          {field('WhatsApp link', 'whatsapp_url', 'https://wa.me/…', true)}
          <label className="block sm:col-span-2">
            <span className={labelClass}>Professional tagline</span>
            <input className={inputClass} value={profile.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Professional introduction</span>
            <textarea rows={4} className={inputClass} value={profile.intro ?? ''} onChange={(e) => set('intro', e.target.value)} />
          </label>
        </div>
        <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.3em] text-ink/35">Do not fabricate credentials — the portfolio is only as honest as this page.</p>
      </div>
    </section>
  );
}

/* ══════════ Contact Messages ══════════ */
type MessageRow = { id: string; name: string; email: string; subject: string | null; message: string; status: 'new' | 'read' | 'archived'; created_at: string };

export function MessagesSection() {
  const supabase = createClient();
  const toast = useToast();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) toast(`Could not load messages: ${error.message}`, 'error');
    setMessages((data as MessageRow[] | null) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const setStatus = async (id: string, status: MessageRow['status']) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) toast(`Update failed: ${error.message}`, 'error');
    else load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) toast(`Delete failed: ${error.message}`, 'error');
    else { toast('Message deleted.', 'ok'); load(); }
  };

  const filtered = messages.filter((m) => (filter === 'all' ? true : m.status === filter));
  const counts = { all: messages.length, new: messages.filter((m) => m.status === 'new').length, read: messages.filter((m) => m.status === 'read').length, archived: messages.filter((m) => m.status === 'archived').length };

  return (
    <section>
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">Inbox</p>
      <h1 className="text-display mt-1 text-2xl font-bold text-navy">Contact Messages</h1>
      <p className="mt-1 max-w-xl text-sm text-ink/60">Everything sent through the public contact scene — validated, rate-limited and stored privately. Only the admin can read these.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(['all', 'new', 'read', 'archived'] as const).map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} className={`rounded-full border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.25em] transition ${filter === tab ? 'border-electric bg-electric text-white' : 'border-navy/12 bg-white text-navy hover:border-electric'}`}>
            {tab} · {counts[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-6 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading inbox…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-navy/15 bg-white p-12 text-center">
          <Inbox size={34} className="mx-auto text-electric/60" />
          <p className="text-display mt-3 text-lg font-bold text-navy">An empty inbox is a feature.</p>
          <p className="mt-1 text-sm text-ink/60">Share the site — messages will start arriving here.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {filtered.map((msg) => (
            <li key={msg.id} className="overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-soft">
              <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={() => setOpenId(openId === msg.id ? null : msg.id)} aria-expanded={openId === msg.id}>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${msg.status === 'new' ? 'bg-electric' : msg.status === 'read' ? 'bg-emerald-400' : 'bg-navy/20'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-navy">{msg.name}{msg.subject ? ` — ${msg.subject}` : ''}</span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ink/40">{msg.email} · {new Date(msg.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-ink/40">{msg.status}</span>
              </button>
              {openId === msg.id ? (
                <div className="border-t border-navy/6 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{msg.message}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject ?? 'Your message to Francis'}`)}`} className="rounded-xl bg-navy px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white transition hover:bg-[#0d2952]">Reply via email</a>
                    {msg.status !== 'read' ? <button onClick={() => setStatus(msg.id, 'read')} className="flex items-center gap-1.5 rounded-xl border border-navy/12 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric"><MailOpen size={12} /> Mark read</button> : null}
                    {msg.status === 'new' ? <button onClick={() => setStatus(msg.id, 'read')} className="hidden" /> : <button onClick={() => setStatus(msg.id, 'new')} className="flex items-center gap-1.5 rounded-xl border border-navy/12 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric"><Mail size={12} /> Mark new</button>}
                    {msg.status !== 'archived' ? <button onClick={() => setStatus(msg.id, 'archived')} className="flex items-center gap-1.5 rounded-xl border border-navy/12 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric"><Archive size={12} /> Archive</button> : <button onClick={() => setStatus(msg.id, 'new')} className="flex items-center gap-1.5 rounded-xl border border-navy/12 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric">Restore</button>}
                    <button onClick={() => remove(msg.id)} className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-50"><Trash2 size={12} /> Delete</button>
                    <button onClick={() => setOpenId(null)} className="rounded-xl border border-navy/12 p-2 text-ink/50 transition hover:text-navy" aria-label="Close"><X size={14} /></button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ══════════ Website Settings (maintenance + sitewide) ══════════ */
export function WebsiteSettingsSection() {
  const supabase = createClient();
  const toast = useToast();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string }>({ enabled: false, message: 'FRANCIS is deploying an update — back shortly.' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('website_settings').select('value').eq('key', 'maintenance').maybeSingle().then(({ data }) => {
      const value = (data as { value?: { live?: typeof maintenance; draft?: typeof maintenance } & typeof maintenance } | null)?.value;
      const live = (value as { live?: { enabled: boolean; message: string } })?.live ?? value;
      if (live && typeof live === 'object' && 'enabled' in live) setMaintenance({ enabled: Boolean(live.enabled), message: live.message || 'FRANCIS is deploying an update — back shortly.' });
      setLoading(false);
    });
  }, [supabase]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('website_settings').upsert({ key: 'maintenance', value: { live: maintenance, draft: null }, updated_at: new Date().toISOString() });
    if (error) toast(`Save failed: ${error.message}`, 'error');
    else toast(maintenance.enabled ? 'Maintenance mode ON — public site shows the holding screen.' : 'Maintenance mode off — public site is live.', 'ok');
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-8 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading settings…</div>;

  return (
    <section className="max-w-3xl">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">Site</p>
      <h1 className="text-display mt-1 text-2xl font-bold text-navy">Website Settings</h1>
      <p className="mt-1 text-sm text-ink/60">Sitewide switches. Use maintenance mode during deploys — visitors see an elegant holding scene while you ship.</p>

      <div className="mt-6 rounded-3xl border border-navy/8 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg font-bold text-navy">Maintenance mode</p>
            <p className="mt-0.5 text-sm text-ink/60">Temporarily replaces the public site with a holding screen. The Admin Studio always stays accessible.</p>
          </div>
          <button role="switch" aria-checked={maintenance.enabled} onClick={() => setMaintenance((m) => ({ ...m, enabled: !m.enabled }))} className={`flex h-10 w-[4.5rem] shrink-0 items-center rounded-full px-1.5 transition ${maintenance.enabled ? 'justify-end bg-red-500' : 'justify-start bg-navy/15'}`} aria-label="Toggle maintenance mode">
            <span className="h-7 w-7 rounded-full bg-white shadow" />
          </button>
        </div>
        <label className="mt-5 block">
          <span className={labelClass}>Holding message</span>
          <textarea rows={2} className={inputClass} value={maintenance.message} onChange={(e) => setMaintenance((m) => ({ ...m, message: e.target.value }))} />
        </label>
        <button onClick={save} disabled={saving} className="mt-5 flex items-center gap-2 rounded-xl bg-navy px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#0d2952] disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Apply settings
        </button>
      </div>
    </section>
  );
}
