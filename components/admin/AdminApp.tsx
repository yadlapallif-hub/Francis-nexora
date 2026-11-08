'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import type { Session } from '@supabase/supabase-js';
import { cn } from '@/lib/cn';
import { LogoMark } from '@/components/brand/LogoMark';
import { EntityEditor, PanelCard } from './shared';
import {
  OverviewPanel, ProfilePanel, MessagesPanel, GalleryPanel, SocialPanel,
} from './panels-content';
import {
  ThemePanel, HomepagePanel, SeoPanel, AiConfigPanel, AiAnalyticsPanel, ChatHistoryPanel,
} from './panels-settings';
import {
  LayoutDashboard, UserRound, BookOpenText, Wrench, GraduationCap, FolderKanban,
  BriefcaseBusiness, Trophy, Images, Inbox, AtSign, Palette, PanelsTopLeft, Search,
  Cpu, ChartNoAxesColumn, MessagesSquare, SlidersHorizontal, Menu, X, LogOut,
  ArrowUpRight, Loader2, ShieldCheck, LockKeyhole, Mail, AlertTriangle,
} from 'lucide-react';

type SectionId =
  | 'overview' | 'profile' | 'about' | 'skills' | 'education' | 'projects' | 'experience'
  | 'achievements' | 'gallery' | 'messages' | 'social' | 'theme' | 'homepage' | 'seo'
  | 'ai-config' | 'ai-analytics' | 'chat-history' | 'settings';

const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile Editor', icon: UserRound },
  { id: 'about', label: 'About Editor', icon: BookOpenText },
  { id: 'skills', label: 'Skills Manager', icon: Wrench },
  { id: 'education', label: 'Education Manager', icon: GraduationCap },
  { id: 'projects', label: 'Project Manager', icon: FolderKanban },
  { id: 'experience', label: 'Experience Manager', icon: BriefcaseBusiness },
  { id: 'achievements', label: 'Achievements Manager', icon: Trophy },
  { id: 'gallery', label: 'Gallery Manager', icon: Images },
  { id: 'messages', label: 'Contact Messages', icon: Inbox },
  { id: 'social', label: 'Social Links', icon: AtSign },
  { id: 'theme', label: 'Website Theme', icon: Palette },
  { id: 'homepage', label: 'Homepage Editor', icon: PanelsTopLeft },
  { id: 'seo', label: 'SEO Settings', icon: Search },
  { id: 'ai-config', label: 'AI Configuration', icon: Cpu },
  { id: 'ai-analytics', label: 'AI Usage Analytics', icon: ChartNoAxesColumn },
  { id: 'chat-history', label: 'Chat History', icon: MessagesSquare },
  { id: 'settings', label: 'Website Settings', icon: SlidersHorizontal },
];

export default function AdminApp() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [section, setSection] = useState<SectionId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        // Fallback: attempt a direct allowlist read (RLS permits admins to read admin_users)
        supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle()
          .then(({ data: row }) => setIsAdmin(Boolean(row)));
        return;
      }
      setIsAdmin(Boolean(data));
    });
    return () => { cancelled = true; };
  }, [session, supabase]);

  if (session === undefined) {
    return <FullScreenShell><Loader2 size={26} className="animate-spin text-electric" /><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.4em] text-skylight/60">Verifying credentials…</p></FullScreenShell>;
  }

  if (!session) return <LoginScreen />;

  if (isAdmin === null) {
    return <FullScreenShell><Loader2 size={26} className="animate-spin text-electric" /><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.4em] text-skylight/60">Checking studio access…</p></FullScreenShell>;
  }

  if (!isAdmin) {
    return (
      <FullScreenShell>
        <ShieldCheck size={40} className="text-amber-400" />
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Access denied</h1>
        <p className="mt-3 max-w-sm text-center text-sm leading-6 text-skylight/70">
          This account ({session.user.email}) is not on the FRANCIS administrator allowlist. There is no self-service access.
        </p>
        <button onClick={() => supabase.auth.signOut()} className="mt-8 rounded-full border border-skylight/25 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-skylight transition hover:border-white hover:text-white">Sign out</button>
      </FullScreenShell>
    );
  }

  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div className="flex h-[100svh] overflow-hidden bg-mist">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-navy/55 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      {/* Sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col bg-navy text-skylight transition-transform duration-300 lg:static lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')} aria-label="Studio navigation">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-sm font-bold tracking-[0.18em] text-white">FRANCIS <span className="text-electric">STUDIO</span></span>
          </Link>
          <button className="rounded-lg p-2 text-skylight/70 hover:bg-white/5 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="px-3 pb-2 font-mono text-[8.5px] uppercase tracking-[0.4em] text-skylight/35">Control Studio</p>
          <ul className="space-y-0.5">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === section;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[11px] font-semibold tracking-wide transition',
                      isActive ? 'bg-electric text-white shadow-glowsm' : 'text-skylight/70 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon size={15} strokeWidth={2} className="shrink-0" />
                    <span className="truncate text-left">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/8 px-5 py-4">
          <p className="truncate text-[10px] text-skylight/45" title={session.user.email ?? ''}>Signed in as <span className="text-skylight/80">{session.user.email}</span></p>
          <button onClick={() => supabase.auth.signOut()} className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-skylight/60 transition hover:text-white"><LogOut size={12} /> Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-navy/8 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-navy/10 p-2 text-navy lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open studio navigation"><Menu size={18} /></button>
            <div>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.4em] text-electric">Private Studio — Admin Only</p>
              <h1 className="font-display text-base font-bold leading-tight text-navy sm:text-lg">{active.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-700 md:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Secured</span>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition hover:border-electric hover:text-electric">View site <ArrowUpRight size={12} /></a>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <SectionRouter section={section} onNavigate={(s) => setSection(s as SectionId)} />
        </div>
      </main>
    </div>
  );
}

/* ─── Section router ─────────────────────────────────────────────────────── */

function SectionRouter({ section, onNavigate }: { section: SectionId; onNavigate: (s: string) => void }) {
  switch (section) {
    case 'overview': return <OverviewPanel onNavigate={onNavigate} />;
    case 'profile': return <ProfilePanel />;
    case 'about':
      return (
        <PanelCard title="About Editor" description="The narrative pillars shown in the About scene and used as approved AI knowledge.">
          <EntityEditor table="about_sections" addLabel="Add pillar" defaults={{ title: '', pillar: '', content: '' }}
            fields={[
              { key: 'pillar', label: 'Pillar (small kicker)', type: 'text', placeholder: 'Identity' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'content', label: 'Content', type: 'textarea', rows: 4 },
            ]} />
        </PanelCard>
      );
    case 'skills':
      return (
        <PanelCard title="Skills Manager" description="Animated bars on the public site — adjust levels honestly; visitors (and the AI) believe these numbers.">
          <EntityEditor table="skills" addLabel="Add skill" defaults={{ name: '', category: 'Programming Languages', level: 70 }}
            fields={[
              { key: 'name', label: 'Skill', type: 'text' },
              { key: 'category', label: 'Category', type: 'select', options: ['Programming Languages', 'Web Development', 'Tools & Platforms', 'Domains'] },
              { key: 'level', label: 'Level (0–100)', type: 'number' },
            ]} />
        </PanelCard>
      );
    case 'education':
      return (
        <PanelCard title="Education Manager" description="Degrees and diplomas — newest first is controlled by the reorder buttons.">
          <EntityEditor table="education" addLabel="Add education entry" defaults={{ degree: '', institution: '', field: '', status: 'Pursuing', start_year: '', end_year: '', description: '' }}
            fields={[
              { key: 'degree', label: 'Degree', type: 'text' },
              { key: 'institution', label: 'Institution', type: 'text' },
              { key: 'field', label: 'Field', type: 'text' },
              { key: 'status', label: 'Status', type: 'select', options: ['Pursuing', 'Completed'] },
              { key: 'start_year', label: 'Start year', type: 'text', placeholder: 'e.g. 2024' },
              { key: 'end_year', label: 'End year', type: 'text', placeholder: 'e.g. 2028' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ]} />
        </PanelCard>
      );
    case 'projects':
      return (
        <PanelCard title="Project Manager" description="NEXORA AGENT is the featured work. Add more, reorder, or hide — changes go live immediately.">
          <EntityEditor table="projects" addLabel="Add project" defaults={{ title: '', slug: '', tagline: '', description: '', technologies: [], features: [], live_url: '', github_url: '', image_url: '', featured: false }}
            fields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'slug', label: 'Slug (unique)', type: 'text', placeholder: 'my-project' },
              { key: 'tagline', label: 'Tagline', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
              { key: 'technologies', label: 'Technologies (comma separated)', type: 'tags', placeholder: 'React, TypeScript, Supabase' },
              { key: 'features', label: 'Features (comma separated)', type: 'tags' },
              { key: 'live_url', label: 'Live URL', type: 'text', placeholder: 'https://' },
              { key: 'github_url', label: 'GitHub URL', type: 'text', placeholder: 'https://' },
              { key: 'image_url', label: 'Image URL (upload via Gallery first, then paste)', type: 'text' },
              { key: 'featured', label: 'Featured', type: 'boolean' },
            ]} />
        </PanelCard>
      );
    case 'experience':
      return (
        <PanelCard title="Experience Manager" description="Internships, leadership, open source — the honest ledger of time spent building.">
          <EntityEditor table="experience" addLabel="Add experience" defaults={{ role: '', organization: '', type: 'Internship', start_date: '', end_date: '', current: false, description: '' }}
            fields={[
              { key: 'role', label: 'Role', type: 'text' },
              { key: 'organization', label: 'Organization', type: 'text' },
              { key: 'type', label: 'Type', type: 'select', options: ['Internship', 'Experience', 'Open Source', 'Leadership', 'Volunteer'] },
              { key: 'start_date', label: 'Start', type: 'text', placeholder: 'Jun 2026' },
              { key: 'end_date', label: 'End', type: 'text', placeholder: 'Aug 2026' },
              { key: 'current', label: 'Currently here', type: 'boolean' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ]} />
        </PanelCard>
      );
    case 'achievements':
      return (
        <PanelCard title="Achievements Manager" description="Trophies get earned, not decorated — add verified wins only.">
          <EntityEditor table="achievements" addLabel="Add achievement" defaults={{ title: '', issuer: '', year: '', description: '', url: '' }}
            fields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'issuer', label: 'Issuer', type: 'text' },
              { key: 'year', label: 'Year', type: 'text', placeholder: '2026' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'url', label: 'Proof URL (certificate / repo / article)', type: 'text', placeholder: 'https://' },
            ]} />
        </PanelCard>
      );
    case 'gallery': return <GalleryPanel />;
    case 'messages': return <MessagesPanel />;
    case 'social': return <SocialPanel />;
    case 'theme': return <ThemePanel />;
    case 'homepage': return <HomepagePanel />;
    case 'seo': return <SeoPanel />;
    case 'ai-config': return <AiConfigPanel />;
    case 'ai-analytics': return <AiAnalyticsPanel />;
    case 'chat-history': return <ChatHistoryPanel />;
    case 'settings': return <WebsiteSettingsPanel />;
    default: return null;
  }
}

/* ─── Website settings (status + environment) ────────────────────────────── */

function WebsiteSettingsPanel() {
  const [aiStatus, setAiStatus] = useState<{ enabled: boolean; configured: boolean } | null>(null);
  useEffect(() => { fetch('/api/ai/status').then((r) => r.json()).then(setAiStatus).catch(() => setAiStatus(null)); }, []);

  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'Site URL', value: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://francis-platform.vercel.app', mono: true },
    { label: 'Stack', value: 'Next.js 15 · React 19 · TypeScript · Tailwind CSS' },
    { label: 'Database', value: 'Supabase Postgres (RLS enforced)' },
    { label: 'AI status', value: aiStatus ? (aiStatus.enabled ? (aiStatus.configured ? 'Enabled · provider configured' : 'Enabled · OPENAI_API_KEY missing') : 'Disabled by admin') : 'Checking…' },
    { label: 'Search provider', value: process.env.NEXT_PUBLIC_SEARCH_PROVIDER ?? 'DuckDuckGo (no key) with optional Serper/Bing' },
  ];

  return (
    <PanelCard title="Website Settings" description="Environment and hosting status. Secrets never leave the server — rotate keys in Vercel, never in this studio.">
      <ul className="divide-y divide-navy/8 rounded-2xl border border-navy/10">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ink/50">{row.label}</span>
            <span className={cn('text-[12px] font-semibold text-navy', row.mono && 'font-mono text-[11px]')}>{row.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="rounded-lg border border-navy/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-navy hover:border-electric hover:text-electric">sitemap.xml</a>
        <a href="/robots.txt" target="_blank" rel="noreferrer" className="rounded-lg border border-navy/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-navy hover:border-electric hover:text-electric">robots.txt</a>
        <a href="/api/health" target="_blank" rel="noreferrer" className="rounded-lg border border-navy/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-navy hover:border-electric hover:text-electric">health check</a>
      </div>
    </PanelCard>
  );
}

/* ─── Login + chrome ─────────────────────────────────────────────────────── */

function FullScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-navy text-skylight">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-30" />
      <div className="pointer-events-none absolute h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(14,138,156,0.25),transparent_68%)]" />
      <div className="relative flex flex-col items-center">{children}</div>
    </main>
  );
}

function LoginScreen() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <FullScreenShell>
      <LogoMark className="h-16 w-16" />
      <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.5em] text-electric">Private — Administrators Only</p>
      <h1 className="display-tight mt-3 text-4xl font-bold text-white sm:text-5xl">FRANCIS <span className="text-electric">STUDIO</span></h1>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-skylight/60"><LockKeyhole size={12} /> No public registration. Access is granted by allowlist.</p>

      <form onSubmit={submit} className="glass-dark mt-10 w-full max-w-sm rounded-3xl p-6 sm:p-7" aria-label="Admin sign in">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-skylight/70"><Mail size={10} /> Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-xl border border-white/12 bg-navy/60 px-4 py-3 text-[13px] text-white outline-none placeholder:text-skylight/30 focus:border-electric" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-skylight/70">Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••"
            className="w-full rounded-xl border border-white/12 bg-navy/60 px-4 py-3 text-[13px] text-white outline-none placeholder:text-skylight/30 focus:border-electric" />
        </label>
        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[11.5px] leading-5 text-red-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-electric px-4 py-4 font-display text-[12px] font-bold uppercase tracking-[0.25em] text-white transition hover:bg-[#0B6E7D] disabled:opacity-60">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LockKeyhole size={15} />} {busy ? 'Verifying…' : 'Enter the studio'}
        </button>
      </form>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-skylight/40 transition hover:text-white">← Back to FRANCIS</Link>
    </FullScreenShell>
  );
}
