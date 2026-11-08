'use client';

import { useState } from 'react';
import { Mail, MapPin, Send, MessageCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { GitHubIcon, InstagramIcon, LinkedInIcon } from '@/components/icons/BrandIcons';
import { SceneTag } from './SceneTag';
import type { Profile, SocialLink } from '@/lib/types';

const SOCIAL_ICONS: Record<string, typeof GitHubIcon> = {
  email: Mail as unknown as typeof GitHubIcon,
  github: GitHubIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  whatsapp: MessageCircle as unknown as typeof GitHubIcon,
};

export function Contact({ profile, socials }: { profile: Profile; socials: SocialLink[] }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', company: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const visibleSocials = socials.filter((s) => s.visible && s.url);
  const mailto = `mailto:${profile.email}`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState('sending');
    setErrorText('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'Something went wrong.');
      setState('sent');
      setForm({ name: '', email: '', subject: '', message: '', company: '' });
    } catch (error) {
      setState('error');
      setErrorText(error instanceof Error ? error.message : 'Could not send right now.');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-navy/12 bg-white px-4 py-3.5 text-[14px] text-ink outline-none transition placeholder:text-ink/40 focus:border-electric focus:ring-2 focus:ring-electric/25';

  return (
    <section id="contact" className="relative overflow-hidden bg-mist py-24 sm:py-32" aria-label="Contact Francis">
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(14,138,156,0.12),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <SceneTag index="07" label="Contact" />
          <h2 className="display-tight mt-5 text-4xl font-bold text-navy sm:text-6xl">
            Let&rsquo;s build<br />something<br /><span className="shimmer-text">meaningful.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-ink/75">
            Internships, collaborations, freelance micro-projects, open source, or just a sharp conversation about AI — the inbox is open.
          </p>

          <div className="mt-8 space-y-4 text-sm">
            <a href={mailto} className="flex items-center gap-4 rounded-2xl border border-navy/8 bg-white p-4 transition hover:border-electric/40 hover:shadow-glowsm">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-skylight"><Mail size={18} /></span>
              <span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/45">Direct email</span>
                <span className="mt-0.5 block font-semibold text-navy">{profile.email}</span>
              </span>
            </a>
            <div className="flex items-center gap-4 rounded-2xl border border-navy/8 bg-white p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-skylight"><MapPin size={18} /></span>
              <span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/45">Based in</span>
                <span className="mt-0.5 block font-semibold text-navy">{profile.location}</span>
              </span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {visibleSocials.map((social) => {
              const Icon = SOCIAL_ICONS[social.platform] ?? Mail;
              const href = social.platform === 'email' ? mailto : social.url;
              return (
                <a key={social.id} href={href} target={social.platform === 'email' ? undefined : '_blank'} rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-navy transition hover:border-electric hover:text-electric">
                  <Icon size={13} /> {social.label ?? social.platform}
                </a>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="glass lg:col-span-7 h-fit rounded-[28px] p-6 sm:p-9" aria-label="Contact form">
          <div className="hidden" aria-hidden="true">
            <label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-name" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-navy/70">Name *</label>
              <input id="c-name" required minLength={2} className={inputClass} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="c-email" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-navy/70">Email *</label>
              <input id="c-email" required type="email" className={inputClass} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="c-subject" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-navy/70">Subject</label>
            <input id="c-subject" className={inputClass} placeholder="Internship · project · collaboration…" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="mt-4">
            <label htmlFor="c-message" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-navy/70">Message *</label>
            <textarea id="c-message" required minLength={10} rows={5} className={inputClass} placeholder="Tell me about the problem you want to solve…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>

          <button type="submit" disabled={state === 'sending'} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-4 font-display text-[13px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-electric disabled:cursor-wait disabled:opacity-70 sm:w-auto">
            {state === 'sending' ? (<><Loader2 size={16} className="animate-spin" /> Transmitting…</>) : (<>Send message <Send size={16} /></>)}
          </button>

          {state === 'sent' && (
            <p role="status" className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> Message received and stored securely. Francis reads everything personally — expect a thoughtful reply.
            </p>
          )}
          {state === 'error' && (
            <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {errorText} If it persists, email <a className="underline" href={mailto}>{profile.email}</a> directly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
