'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, User, AlignLeft, Cpu, GraduationCap, FolderKanban, Briefcase, Trophy,
  Share2, Image as ImageIcon, Inbox, MonitorSmartphone, Palette, Search, SlidersHorizontal,
  BarChart3, MessagesSquare, Settings, LogOut, ExternalLink, Loader2, ShieldCheck, Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LogoMark } from '@/components/brand';
import { ToastProvider } from './toast';
import EntityEditor, { type Field } from './EntityEditor';
import Overview from './overview';
import { ProfileEditor, MessagesSection, WebsiteSettingsSection } from './editors-content';
import { AiConfigSection, AiAnalyticsSection, ChatHistorySection } from './editors-ai';
import { HomepageSection, ThemeSection, SeoSection } from './editors-settings';

type SectionId =
  | 'overview' | 'profile' | 'about' | 'skills' | 'education' | 'projects' | 'experience'
  | 'achievements' | 'socials' | 'gallery' | 'messages' | 'homepage' | 'theme' | 'seo'
  | 'ai-config' | 'ai-analytics' | 'chat-history' | 'settings';

const GROUPS: Array<{ label: string; items: Array<{ id: SectionId; label: string; icon: typeof LayoutDashboard }> }> = [
  { label: 'Overview', items: [{ id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard }] },
  {
    label: 'Content',
    items: [
      { id: 'profile', label: 'Profile Editor', icon: User },
      { id: 'about', label: 'About Editor', icon: AlignLeft },
      { id: 'skills', label: 'Skills Manager', icon: Cpu },
      { id: 'education', label: 'Education Manager', icon: GraduationCap },
      { id: 'projects', label: 'Project Manager', icon: FolderKanban },
      { id: 'experience', label: 'Experience Manager', icon: Briefcase },
      { id: 'achievements', label: 'Achievements Manager', icon: Trophy },
    ],
  },
  {
    label: 'Media & Inbox',
    items: [
      { id: 'gallery', label: 'Gallery Manager', icon: ImageIcon },
      { id: 'socials', label: 'Social Links', icon: Share2 },
      { id: 'messages', label: 'Contact Messages', icon: Inbox },
    ],
  },
  {
    label: 'Site',
    items: [
      { id: 'homepage', label: 'Homepage Editor', icon: MonitorSmartphone },
      { id: 'theme', label: 'Theme Editor', icon: Palette },
      { id: 'seo', label: 'SEO Settings', icon: Search },
      { id: 'settings', label: 'Website Settings', icon: Settings },
    ],
  },
  {
    label: 'FRANCIS AI',
    items: [
      { id: 'ai-config', label: 'AI Configuration', icon: SlidersHorizontal },
      { id: 'ai-analytics', label: 'AI Usage Analytics', icon: BarChart3 },
      { id: 'chat-history', label: 'Chat History', icon: MessagesSquare },
    ],
  },
];

const SKILL_FIELDS: Field[] = [
  { key: 'name', label: 'Skill', type: 'text', span: 1 },
  { key: 'category', label: 'Category', type: 'text', placeholder: 'Programming Languages', span: 1 },
  { key: 'level', label: 'Level (0–100)', type: 'level', span: 2 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const ABOUT_FIELDS: Field[] = [
  { key: 'title', label: 'Headline', type: 'text', span: 1 },
  { key: 'pillar', label: 'Pillar tag', type: 'text', placeholder: 'Identity / Craft / Mindset', span: 1 },
  { key: 'content', label: 'Content', type: 'textarea', span: 2 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const EDUCATION_FIELDS: Field[] = [
  { key: 'degree', label: 'Degree', type: 'text', placeholder: 'B.Tech', span: 1 },
  { key: 'institution', label: 'Institution', type: 'text', placeholder: 'Raghu Engineering College', span: 1 },
  { key: 'field', label: 'Field of study', type: 'text', span: 2 },
  { key: 'status', label: 'Status', type: 'select', options: ['Pursuing', 'Completed', 'On hold'], span: 1 },
  { key: 'description', label: 'Description', type: 'textarea', span: 2 },
  { key: 'start_year', label: 'Start year (optional)', type: 'text', placeholder: '2023', span: 1 },
  { key: 'end_year', label: 'End year (optional)', type: 'text', placeholder: '2027', span: 1 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const PROJECT_FIELDS: Field[] = [
  { key: 'title', label: 'Project title', type: 'text', span: 2 },
  { key: 'slug', label: 'Slug', type: 'text', placeholder: 'my-project', span: 1 },
  { key: 'tagline', label: 'Tagline', type: 'text', span: 2 },
  { key: 'description', label: 'Description', type: 'textarea', span: 2 },
  { key: 'image_url', label: 'Project image', type: 'image', span: 2 },
  { key: 'live_url', label: 'Live URL', type: 'url', span: 1 },
  { key: 'github_url', label: 'GitHub URL', type: 'url', span: 1 },
  { key: 'technologies', label: 'Technologies (one per line)', type: 'stringArray', span: 1 },
  { key: 'features', label: 'Features (one per line)', type: 'stringArray', span: 1 },
  { key: 'featured', label: 'Featured project', type: 'boolean', span: 1 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const EXPERIENCE_FIELDS: Field[] = [
  { key: 'role', label: 'Role', type: 'text', span: 1 },
  { key: 'organization', label: 'Organization', type: 'text', span: 1 },
  { key: 'type', label: 'Type', type: 'select', options: ['Experience', 'Internship', 'Open Source', 'Freelance', 'Hackathon', 'Project'], span: 1 },
  { key: 'start_date', label: 'Start', type: 'text', placeholder: '2026-01', span: 1 },
  { key: 'end_date', label: 'End', type: 'text', placeholder: '2026-06', span: 1 },
  { key: 'current', label: 'Currently active', type: 'boolean', span: 1 },
  { key: 'description', label: 'Description', type: 'textarea', span: 2 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const ACHIEVEMENT_FIELDS: Field[] = [
  { key: 'title', label: 'Achievement', type: 'text', span: 2 },
  { key: 'issuer', label: 'Issuer', type: 'text', span: 1 },
  { key: 'year', label: 'Year', type: 'text', placeholder: '2026', span: 1 },
  { key: 'description', label: 'Description', type: 'textarea', span: 2 },
  { key: 'url', label: 'Proof URL (optional)', type: 'url', span: 2 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const SOCIAL_FIELDS: Field[] = [
  { key: 'platform', label: 'Platform', type: 'select', options: ['github', 'linkedin', 'instagram', 'whatsapp', 'email', 'twitter', 'youtube', 'website'], span: 1 },
  { key: 'label', label: 'Label', type: 'text', span: 1 },
  { key: 'url', label: 'URL', type: 'text', placeholder: 'https://… or mailto:… or wa.me/<number>', span: 2, help: 'Leave empty and keep hidden to keep a channel private until it is ready.' },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

const GALLERY_FIELDS: Field[] = [
  { key: 'image_url', label: 'Image', type: 'image', span: 2 },
  { key: 'caption', label: 'Caption', type: 'text', span: 2 },
  { key: 'display_order', label: 'Display order', type: 'number', span: 1 },
  { key: 'visible', label: 'Visible', type: 'boolean', span: 1 },
];

function AdminGate({ onAuthed, adminEmail }: { onAuthed: () => void; adminEmail: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError('Sign-in failed. Check the email and password. (Only the platform administrator can sign in — there is no public registration.)');
      setBusy(false);
      return;
    }
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError('This account is authenticated but is NOT on the FRANCIS admin allowlist. Access denied.');
      setBusy(false);
      return;
    }
    onAuthed();
  };

  return (
    <main className="hero-scene noise relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-electric/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-electric/10 blur-3xl" aria-hidden="true" />
      <form onSubmit={submit} className="glass-dark relative z-10 w-full max-w-md rounded-[2rem] p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={64} />
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.5em] text-blue-300/80">FRANCIS · Secure Access</p>
          <h1 className="text-display mt-2 text-3xl font-bold text-white">Admin Control Studio</h1>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/70">Private control surface for the FRANCIS platform. Authorized administrators only — no public registration exists.</p>
        </div>
        <label className="mt-8 block">
          <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-blue-200/70">Admin email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-blue-200/30 focus:border-electric/70 focus:ring-2 focus:ring-electric/30" placeholder="admin@example.com" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-blue-200/70">Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-blue-200/30 focus:border-electric/70 focus:ring-2 focus:ring-electric/30" placeholder="••••••••" />
        </label>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[12.5px] leading-snug text-red-200" role="alert">{error}</p>
        ) : null}
        <button type="submit" disabled={busy} className="btn-shine mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-electric px-6 py-4 font-display text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} Enter the Studio
        </button>
        <Link href="/" className="mt-5 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-blue-200/50 transition hover:text-blue-100">← Back to the public site</Link>
      </form>
    </main>
  );
}

export default function AdminStudio() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [auth, setAuth] = useState<'loading' | 'anon' | 'ready'>('loading');
  const [active, setActive] = useState<SectionId>('overview');
  const [unread, setUnread] = useState(0);
  const [accountEmail, setAccountEmail] = useState<string>('');

  const check = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuth('anon'); return; }
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) { setAuth('anon'); return; }
    setAccountEmail(session.user.email ?? '');
    setAuth('ready');
  }, [supabase]);

  useEffect(() => { check(); }, [check]);
  useEffect(() => { const { data: sub } = supabase.auth.onAuthStateChange(() => check()); return () => sub.subscription.unsubscribe(); }, [supabase, check]);

  useEffect(() => {
    if (auth !== 'ready') return;
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new').then(({ count }) => setUnread(count ?? 0));
  }, [auth, supabase, active]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuth('anon');
    router.refresh();
  };

  if (auth === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#040e22]" role="status" aria-label="Checking admin session">
        <div className="flex flex-col items-center gap-4">
          <LogoMark size={56} className="animate-pulse" />
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blue-300/70">Verifying clearance…</p>
        </div>
      </main>
    );
  }
  if (auth === 'anon') return <ToastProvider><AdminGate adminEmail="yadlapallif@gmail.com" onAuthed={check} /></ToastProvider>;

  const renderSection = () => {
    switch (active) {
      case 'overview': return <Overview onNavigate={(id) => setActive(id as SectionId)} />;
      case 'profile': return <ProfileEditor />;
      case 'about': return <EntityEditor table="about_sections" title="About Editor" description="The three pillars behind Francis. Edit copy, reorder, hide — changes publish instantly." fields={ABOUT_FIELDS} defaultValues={{ title: '', pillar: '', content: '', display_order: 99, visible: true }} addLabel="Add pillar" />;
      case 'skills': return <EntityEditor table="skills" title="Skills Manager" description="Francis's self-assessed skill levels shown on the public site. Keep them honest — edit any time." fields={SKILL_FIELDS} defaultValues={{ name: '', category: 'Programming Languages', level: 70, display_order: 99, visible: true }} addLabel="Add skill" />;
      case 'education': return <EntityEditor table="education" title="Education Manager" description="Academic journey — B.Tech CSE at Raghu Engineering College and the Diploma in Computer Engineering." fields={EDUCATION_FIELDS} defaultValues={{ degree: '', institution: '', field: '', status: 'Pursuing', description: '', start_year: '', end_year: '', display_order: 99, visible: true }} addLabel="Add education" />;
      case 'projects': return <EntityEditor table="projects" title="Project Manager" description="Featured work including NEXORA AGENT. Upload imagery, edit copy, reorder — everything public renders from here." fields={PROJECT_FIELDS} defaultValues={{ title: '', slug: '', tagline: '', description: '', technologies: [], features: [], live_url: '', github_url: '', image_url: '', featured: false, display_order: 99, visible: true }} addLabel="Add project" />;
      case 'experience': return <EntityEditor table="experience" title="Experience Manager" description="Internships, open source, freelance and hackathons — recorded here as they happen." fields={EXPERIENCE_FIELDS} defaultValues={{ role: '', organization: '', type: 'Internship', start_date: '', end_date: '', current: true, description: '', display_order: 99, visible: true }} addLabel="Add entry" emptyHint="Francis is just getting started — internships and collaborations will appear here." />;
      case 'achievements': return <EntityEditor table="achievements" title="Achievements Manager" description="Certifications, competitions and recognitions — with proof links." fields={ACHIEVEMENT_FIELDS} defaultValues={{ title: '', issuer: '', year: '', description: '', url: '', display_order: 99, visible: true }} addLabel="Add achievement" />;
      case 'socials': return <EntityEditor table="social_links" title="Social Links Manager" description="Every public channel — shown on the site, the contact scene and the footer. Empty + hidden = private until ready." fields={SOCIAL_FIELDS} defaultValues={{ platform: 'github', label: '', url: '', display_order: 99, visible: false }} addLabel="Add channel" />;
      case 'gallery': return <EntityEditor table="gallery" title="Gallery Manager" description="Photography and visuals for the studio — upload once, they render wherever the gallery is used." fields={GALLERY_FIELDS} defaultValues={{ image_url: '', caption: '', display_order: 99, visible: true }} addLabel="Add image" emptyHint="No images yet — upload your first with the button above." />;
      case 'messages': return <MessagesSection />;
      case 'homepage': return <HomepageSection />;
      case 'theme': return <ThemeSection />;
      case 'seo': return <SeoSection />;
      case 'ai-config': return <AiConfigSection />;
      case 'ai-analytics': return <AiAnalyticsSection />;
      case 'chat-history': return <ChatHistorySection />;
      case 'settings': return <WebsiteSettingsSection />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-soft">
        {/* Sidebar */}
        <aside className="flex w-16 shrink-0 flex-col bg-navy text-blue-100 lg:w-72">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/8 px-3 lg:px-5">
            <LogoMark size={34} />
            <span className="hidden leading-tight lg:block">
              <span className="block font-display text-[13px] font-bold tracking-[0.22em] text-white">FRANCIS</span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.32em] text-blue-300/70">Admin Control Studio</span>
            </span>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3 lg:px-3" aria-label="Studio sections">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1.5 hidden px-2 font-mono text-[8px] uppercase tracking-[0.4em] text-blue-300/50 lg:block">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map(({ id, label, icon: Icon }) => {
                    const activeItem = active === id;
                    return (
                      <li key={id}>
                        <button
                          onClick={() => setActive(id)}
                          aria-current={activeItem ? 'page' : undefined}
                          title={label}
                          className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition lg:px-3 ${activeItem ? 'bg-electric text-white shadow-[0_0_22px_-6px_rgba(37,99,235,0.7)]' : 'text-blue-100/75 hover:bg-white/5 hover:text-white'}`}
                        >
                          <Icon size={17} className="shrink-0" />
                          <span className="hidden flex-1 truncate font-display text-[12px] font-semibold lg:block">{label}</span>
                          {id === 'messages' && unread > 0 ? (
                            <span className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 font-mono text-[8px] font-bold text-white lg:flex">{unread}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="shrink-0 border-t border-white/8 p-2 lg:p-3">
            <p className="mb-2 hidden truncate px-2 font-mono text-[8px] uppercase tracking-[0.3em] text-blue-300/50 lg:block" title={accountEmail}>Signed in · {accountEmail}</p>
            <div className="flex items-center gap-1.5">
              <a href="/" target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-2 py-2.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-blue-100/80 transition hover:border-electric/60 hover:text-white" title="Open the public site"><ExternalLink size={13} /><span className="hidden lg:inline">View site</span></a>
              <button onClick={signOut} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-2 py-2.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-blue-100/80 transition hover:border-red-400/50 hover:text-red-200" title="Sign out"><LogOut size={13} /><span className="hidden lg:inline">Sign out</span></button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{renderSection()}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
