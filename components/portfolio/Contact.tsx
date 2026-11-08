'use client';

import { useState, type FormEvent } from 'react';
import { Send, Loader2, CheckCircle2, AlertTriangle, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { InstagramIcon as Instagram, GitHubIcon as Github, LinkedInIcon as Linkedin } from '@/components/brand-icons';
import Link from 'next/link';
import { SceneHeading } from '@/components/motion/Reveal';
import type { SiteContent } from '@/lib/types';

type Status = 'idle' | 'sending' | 'sent' | 'error';

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;
const CHANNEL_ICONS: Record<string, IconComponent> = {
  email: Mail,
  whatsapp: MessageCircle,
  instagram: Instagram,
  github: Github,
  linkedin: Linkedin,
};

export default function Contact({ content }: { content: SiteContent }) {
  const { profile, socials } = content;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const channels = [...(socials ?? [])].sort((a, b) => a.display_order - b.display_order);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Something went wrong.');
      setStatus('sent');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  return (
    <section id="contact" className="noise relative overflow-hidden bg-navy py-24 text-white">
      <div className="absolute right-[-15%] top-[-20%] h-[32rem] w-[32rem] rounded-full bg-electric/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SceneHeading light scene="08" kicker="Contact" title={<>Let&apos;s build something <span className="text-electric">meaningful</span>.</>} />
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="max-w-md leading-relaxed text-blue-100/80">
              Whether it&apos;s an internship, a project collaboration, or just a good conversation about technology — my inbox is open. I reply personally.
            </p>
            <ul className="mt-8 space-y-3">
              {channels.map((link) => {
                const Icon = CHANNEL_ICONS[link.platform] ?? Mail;
                const configured = Boolean(link.url);
                const body = (
                  <>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/5"><Icon size={17} className="text-blue-200" /></span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.35em] text-blue-300/70">{link.label ?? link.platform}</span>
                      <span className="block truncate font-display text-sm font-semibold text-white">{configured ? link.url.replace(/^mailto:/, '') : 'Coming soon — set it from the Admin Studio'}</span>
                    </span>
                  </>
                );
                return (
                  <li key={link.platform}>
                    {configured ? (
                      <a href={link.url} target={link.url.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5 transition hover:border-electric/45 hover:bg-white/[0.06]">
                        {body}
                      </a>
                    ) : (
                      <div className="flex cursor-not-allowed items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 opacity-55" aria-disabled="true">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link href="/ai" className="mt-8 inline-flex items-center gap-2 rounded-full border border-electric/50 bg-electric/10 px-6 py-3 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-blue-200 transition hover:bg-electric hover:text-white">
              <Sparkles size={14} /> Or just ask FRANCIS AI
            </Link>
          </div>

          <form onSubmit={onSubmit} className="glass relative rounded-[1.75rem] p-6 text-navy sm:p-8" aria-label="Contact form">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-electric">Direct line</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">Name</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Your name" className="w-full rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25" />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">Email</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} placeholder="you@example.com" className="w-full rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Internship · Collaboration · Hello" className="w-full rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25" />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">Message</span>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} rows={5} placeholder="Tell me about the opportunity, idea or question…" className="w-full resize-y rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25" />
            </label>
            {/* Honeypot — hidden from humans */}
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

            {status === 'error' ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error} <a className="font-semibold underline" href={`mailto:${profile.email}`}>Email {profile.email} directly →</a></span>
              </p>
            ) : null}
            {status === 'sent' ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <CheckCircle2 size={17} /> Message received — Francis will reply soon. Talk soon!
              </p>
            ) : null}

            <button type="submit" disabled={status === 'sending'} className="btn-shine mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-electric px-6 py-4 font-display text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-70">
              {status === 'sending' ? (<><Loader2 size={16} className="animate-spin" /> Transmitting…</>) : (<>Send message <Send size={16} /></>)}
            </button>
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">Stored securely · visible only to Francis</p>
          </form>
        </div>
      </div>
    </section>
  );
}
