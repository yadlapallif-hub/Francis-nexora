'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, FileText, Sparkles } from 'lucide-react';
import { LogoMark, Wordmark } from '@/components/brand/LogoMark';
import { cn } from '@/lib/cn';

const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Work', href: '#work' },
  { label: 'Contact', href: '#contact' },
];

export function Nav({ resumeUrl }: { resumeUrl?: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const light = !scrolled; // over the dark hero

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'border-b border-navy/5 bg-white/75 shadow-[0_10px_40px_-20px_rgba(10,10,12,0.35)] backdrop-blur-xl' : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8" aria-label="Primary">
        <Link href="/" className="group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-electric rounded-xl">
          <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-6" />
          <span className="hidden sm:block">
            <Wordmark light={light} className="transition-colors duration-500" />
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors',
                light ? 'text-skylight/85 hover:text-white' : 'text-navy/70 hover:text-electric'
              )}
            >
              {link.label}
            </a>
          ))}
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors',
                light ? 'text-skylight/85 hover:text-white' : 'text-navy/70 hover:text-electric'
              )}
            >
              <FileText size={13} strokeWidth={2.4} /> Resume
            </a>
          ) : null}
          <Link
            href="/ai"
            className="group flex items-center gap-2 rounded-full bg-electric px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.16em] text-white shadow-glowsm transition hover:bg-[#c00500] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric"
          >
            <Sparkles size={13} strokeWidth={2.5} className="transition-transform duration-300 group-hover:scale-125" />
            FRANCIS AI
            <ArrowUpRight size={13} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          className={cn('rounded-lg p-2 md:hidden', light ? 'text-skylight' : 'text-navy')}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div className="fixed inset-x-0 top-[68px] bottom-0 z-40 bg-navy/97 backdrop-blur-xl md:hidden">
          <div className="flex h-full flex-col items-center justify-center gap-7 px-6">
            {LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display text-3xl font-bold tracking-tight text-skylight transition hover:text-white"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                {link.label}
              </a>
            ))}
            {resumeUrl && (
              <a href={resumeUrl} target="_blank" rel="noreferrer" className="font-display text-3xl font-bold text-skylight transition hover:text-white">
                Resume
              </a>
            )}
            <Link
              href="/ai"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-3 rounded-full bg-electric px-8 py-4 font-display text-lg font-bold text-white shadow-glow"
            >
              <Sparkles size={18} /> Ask FRANCIS AI <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
