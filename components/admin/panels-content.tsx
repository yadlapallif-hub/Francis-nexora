'use client';

import { useCallback, useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { cn } from '@/lib/cn';
import {
  PanelCard, Field, INPUT, Toggle, EntityEditor, UploadButton, useSupabaseTable,
} from './shared';
import {
  FolderKanban, Wrench, Inbox, MessagesSquare, Cpu, Mail, Trash2, Loader2,
  ArrowUpRight, Check, Archive, CircleDot, Image as ImageIcon, Save,
} from 'lucide-react';

/* ═══════════ 1 · OVERVIEW ═══════════ */

export function OverviewPanel({ onNavigate }: { onNavigate: (section: string) => void }) {
  const supabase = getBrowserSupabase();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentMessages, setRecentMessages] = useState<Array<{ id: string; name: string; subject: string | null; created_at: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
      const [projects, skills, allMessages, newMessages, sessions7d, usage7d, achievements] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('updated_at', since7d),
        supabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
        supabase.from('achievements').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        projects: projects.count ?? 0,
        skills: skills.count ?? 0,
        messages: allMessages.count ?? 0,
        newMessages: newMessages.count ?? 0,
        sessions7d: sessions7d.count ?? 0,
        usage7d: usage7d.count ?? 0,
        achievements: achievements.count ?? 0,
      });
      const { data } = await supabase
        .from('contact_messages')
        .select('id, name, subject, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentMessages(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const cards = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, section: 'projects' },
    { label: 'Skills', value: stats.skills, icon: Wrench, section: 'skills' },
    { label: 'Inbox (new)', value: stats.newMessages, icon: Inbox, section: 'messages', accent: (stats.newMessages ?? 0) > 0 },
    { label: 'AI chats · 7d', value: stats.sessions7d, icon: MessagesSquare, section: 'chathistory' },
    { label: 'AI requests · 7d', value: stats.usage7d, icon: Cpu, section: 'ai-analytics' },
    { label: 'Achievements', value: stats.achievements, icon: ArrowUpRight, section: 'achievements' },
  ];

  return (
    <PanelCard title="Studio Overview" description="Live pulse of the FRANCIS platform — content, inbox and AI usage at a glance.">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-navy/60"><Loader2 size={18} className="animate-spin" /> Loading overview…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, section, accent }) => (
              <button key={label} onClick={() => onNavigate(section)}
                className={cn('group rounded-2xl border border-navy/10 bg-mist p-4 text-left transition hover:-translate-y-0.5 hover:border-electric hover:shadow-glowsm', accent && 'border-electric/50 bg-skylight')}>
                <Icon size={17} className="text-electric" />
                <p className="mt-3 font-display text-3xl font-bold text-navy">{value ?? 0}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/55">{label}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-navy/10">
            <div className="flex items-center justify-between border-b border-navy/8 px-5 py-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-navy/60">Latest inbox mail</p>
              <button onClick={() => onNavigate('messages')} className="text-[11px] font-bold uppercase tracking-widest text-electric hover:text-navy">Open inbox →</button>
            </div>
            {recentMessages.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12px] text-ink/50">Inbox zero. Messages from the contact form will appear here.</p>
            ) : (
              <ul className="divide-y divide-navy/6">
                {recentMessages.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-navy">{m.name}{m.subject ? <span className="font-normal text-ink/60"> — {m.subject}</span> : null}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-ink/40">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest', m.status === 'new' ? 'bg-electric text-white' : 'bg-mist text-ink/55')}>{m.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PanelCard>
  );
}

/* ═══════════ 2 · PROFILE EDITOR ═══════════ */

const PROFILE_FIELDS: Array<{ key: string; label: string; textarea?: boolean }> = [
  { key: 'full_name', label: 'Full name' },
  { key: 'display_name', label: 'Display name' },
  { key: 'title', label: 'Professional title' },
  { key: 'email', label: 'Email' },
  { key: 'location', label: 'Location' },
  { key: 'education', label: 'Education (current)' },
  { key: 'college', label: 'College / Institution' },
  { key: 'previous_education', label: 'Previous education' },
  { key: 'tagline', label: 'Brand tagline' },
];

export function ProfilePanel() {
  const supabase = getBrowserSupabase();
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', 'francis').maybeSingle().then(({ data, error }) => {
      if (error) setError(error.message);
      if (data) {
        setForm(data as Record<string, string>);
        setAvatarUrl(data.avatar_url ?? '');
        setResumeUrl(data.resume_url ?? '');
      }
    });
  }, [supabase]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    const payload = { ...form, id: 'francis', avatar_url: avatarUrl, resume_url: resumeUrl };
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) setError(error.message);
    else { setFlash(true); window.setTimeout(() => setFlash(false), 1800); }
    setSaving(false);
  };

  if (!form) return <div className="flex items-center justify-center gap-2 py-16 text-navy/60"><Loader2 size={18} className="animate-spin" /> Loading profile…</div>;

  const set = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <PanelCard
      title="Profile Editor"
      description="Identity shown across the hero, about, footer, contact, resume button and FRANCIS AI's approved knowledge."
      actions={<button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-electric px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#c00500]">{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save profile</button>}
    >
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</p>}
      {flash && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-800">Saved. The public site now reflects these details.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {PROFILE_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label}>
            <input className={INPUT} value={form[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { key: 'instagram_url', label: 'Instagram URL' },
          { key: 'github_url', label: 'GitHub URL' },
          { key: 'linkedin_url', label: 'LinkedIn URL' },
          { key: 'whatsapp_url', label: 'WhatsApp URL (https://wa.me/91…)' },
        ].map(({ key, label }) => (
          <Field key={key} label={label}>
            <input className={INPUT} placeholder="https://" value={form[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="mt-4">
        <Field label="Professional introduction">
          <textarea rows={3} className={cn(INPUT, 'leading-6')} value={form.intro ?? ''} onChange={(e) => set('intro', e.target.value)} />
        </Field>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 p-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Portrait</p>
          <div className="mt-2 flex items-center gap-4">
            {avatarUrl && <img src={avatarUrl} alt="Avatar preview" className="h-16 w-16 rounded-2xl border border-navy/10 object-cover" />}
            <UploadButton bucket="media" folder="avatar" accept="image/*" label="Upload portrait" onUploaded={setAvatarUrl} />
          </div>
        </div>
        <div className="rounded-2xl border border-navy/10 p-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">Résumé (PDF)</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {resumeUrl && <a href={resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-electric/40 px-3 py-2 text-[11px] font-bold text-electric hover:bg-skylight">View current PDF <ArrowUpRight size={11} /></a>}
            <UploadButton bucket="resume" folder="resume" accept=".pdf" label="Upload résumé PDF" onUploaded={setResumeUrl} />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-ink/45">Uploading replaces the résumé link used by the "Résumé" buttons across the site.</p>
        </div>
      </div>
    </PanelCard>
  );
}

/* ═══════════ 10 · CONTACT INBOX ═══════════ */

interface InboxMessage {
  id: string; name: string; email: string; subject: string | null; message: string; status: 'new' | 'read' | 'archived'; created_at: string;
}

export function MessagesPanel() {
  const supabase = getBrowserSupabase();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setMessages((data as InboxMessage[]) ?? []);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (id: string, status: InboxMessage['status']) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    await supabase.from('contact_messages').update({ status }).eq('id', id);
  };
  const remove = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('contact_messages').delete().eq('id', id);
  };

  return (
    <PanelCard
      title="Contact Inbox"
      description="Every message sent through the public contact form — stored securely in Supabase."
      actions={
        <div className="flex gap-1 rounded-xl bg-mist p-1">
          {(['all', 'new', 'read', 'archived'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('rounded-lg px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition', filter === f ? 'bg-navy text-white' : 'text-ink/55 hover:text-navy')}>{f}</button>
          ))}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-navy/60"><Loader2 size={18} className="animate-spin" /> Loading inbox…</div>
      ) : messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy/20 py-14 text-center text-[13px] text-ink/50">No messages here yet.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-navy/10 bg-mist/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => setExpanded(expanded === m.id ? null : m.id)} aria-expanded={expanded === m.id}>
                  <span className="flex items-center gap-2 text-[13px] font-bold text-navy">
                    {m.status === 'new' && <span className="h-2 w-2 rounded-full bg-electric" aria-label="Unread" />}
                    {m.name}
                    <span className="font-normal text-ink/45">&lt;{m.email}&gt;</span>
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-ink/65">{m.subject || '(no subject)'} · {new Date(m.created_at).toLocaleString()}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Hello Francis')}`} title="Reply by email" className="rounded-lg p-2 text-navy/55 transition hover:bg-white hover:text-electric"><Mail size={15} /></a>
                  <button onClick={() => setStatus(m.id, 'read')} title="Mark read" className="rounded-lg p-2 text-navy/55 transition hover:bg-white hover:text-emerald-600"><Check size={15} /></button>
                  <button onClick={() => setStatus(m.id, 'archived')} title="Archive" className="rounded-lg p-2 text-navy/55 transition hover:bg-white hover:text-amber-600"><Archive size={15} /></button>
                  <button onClick={() => setStatus(m.id, 'new')} title="Mark as new" className="rounded-lg p-2 text-navy/55 transition hover:bg-white hover:text-electric"><CircleDot size={15} /></button>
                  <button onClick={() => remove(m.id)} title="Delete forever" className="rounded-lg p-2 text-navy/55 transition hover:bg-white hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
              {expanded === m.id && <p className="mt-4 whitespace-pre-wrap border-t border-navy/10 pt-4 text-[13px] leading-6 text-ink/85">{m.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

/* ═══════════ 9 · GALLERY ═══════════ */

export function GalleryPanel() {
  const { rows, loading, error, insert, remove, setRows, upsert } = useSupabaseTable('gallery');
  const [savingId, setSavingId] = useState<string | null>(null);

  const saveCaption = async (row: (typeof rows)[number]) => {
    setSavingId(row.id);
    await upsert(row);
    setSavingId(null);
  };

  return (
    <PanelCard
      title="Gallery Manager"
      description="Visual moments from the studio — uploaded to private-admin-managed storage, served publicly."
      actions={<UploadButton bucket="media" folder="gallery" accept="image/*" label="Upload image" onUploaded={(url) => void insert({ image_url: url, caption: '', display_order: rows.length + 1, visible: true })} />}
    >
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</p>}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-navy/60"><Loader2 size={18} className="animate-spin" /> Loading gallery…</div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy/20 py-14 text-center text-[13px] text-ink/50"><ImageIcon className="mx-auto mb-3 text-navy/30" size={28} />No gallery images yet — upload the first shot.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => (
            <figure key={row.id} className="group overflow-hidden rounded-2xl border border-navy/10 bg-mist">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={String(row.image_url)} alt={String(row.caption ?? 'Gallery image')} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <button onClick={() => remove(row.id)} className="absolute right-2 top-2 rounded-lg bg-navy/80 p-2 text-white opacity-0 backdrop-blur transition hover:bg-red-600 focus:opacity-100 group-hover:opacity-100" aria-label="Delete image"><Trash2 size={13} /></button>
              </div>
              <figcaption className="p-2.5">
                <input className="w-full rounded-lg border-transparent bg-transparent px-2 py-1.5 text-[11px] text-ink/80 outline-none placeholder:text-ink/35 focus:border-electric/40 focus:bg-white" placeholder="Caption…" value={String(row.caption ?? '')} onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, caption: e.target.value } : r)))} onBlur={() => saveCaption(rows.find((r) => r.id === row.id)!)} />
                {savingId === row.id && <p className="px-2 font-mono text-[8px] uppercase tracking-widest text-electric">Saving…</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

/* ═══════════ 11 · SOCIAL LINKS ═══════════ */

export function SocialPanel() {
  return (
    <PanelCard title="Social Links Manager" description="Where the site points the world — footer, contact section and FRANCIS AI's answers. LinkedIn and WhatsApp stay hidden until you add a URL.">
      <EntityEditor
        table="social_links"
        addLabel="Add social link"
        defaults={{ platform: 'github', label: '', url: '' }}
        fields={[
          { key: 'platform', label: 'Platform', type: 'select', options: ['email', 'github', 'instagram', 'linkedin', 'whatsapp', 'x', 'youtube', 'portfolio'] },
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'url', label: 'URL', type: 'text', placeholder: 'https://…' },
        ]}
      />
    </PanelCard>
  );
}
