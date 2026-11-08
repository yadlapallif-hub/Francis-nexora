'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, FileText, Asterisk } from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { LogoMark, Wordmark } from '@/components/brand/LogoMark';
import { cn } from '@/lib/cn';

/**
 * One-to-one with the homepage scenes — every link maps to exactly one
 * section id, and the active link ignites as its section enters the rail.
 */
const LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Skills', id: 'skills' },
  { label: 'Education', id: 'education' },
  { label: 'Work', id: 'work' },
  { label: 'Career', id: 'experience' },
  { label: 'Contact', id: 'contact' },
] as const;

type LinkId = (typeof LINKS)[number]['id'];

export function Nav({ resumeUrl }: { resumeUrl?: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LinkId | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

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

  // Scroll-spy — one section in view at a time lights exactly one link.
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as LinkId);
        }
      },
      { rootMargin: '-35% 0px -58% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const light = !scrolled; // over the dark hero

  const linkTone = (id: LinkId) => {
    const isActive = active === id;
    if (light) return isActive ? 'text-white' : 'text-skylight/85 hover:text-white';
    return isActive ? 'text-electric' : 'text-navy/70 hover:text-electric';
  };

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

        <div className="hidden items-center gap-5 lg:flex xl:gap-6">
          {LINKS.map((link) => {
            const isActive = active === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group relative pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors xl:text-[12px]',
                  linkTone(link.id)
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -bottom-0.5 left-0 h-[2px] rounded-full bg-electric transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  )}
                />
              </a>
            );
          })}
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'hidden items-center gap-1.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors xl:flex xl:text-[12px]',
                light ? 'text-skylight/85 hover:text-white' : 'text-navy/70 hover:text-electric'
              )}
            >
              <FileText size={13} strokeWidth={2.4} /> Resume
            </a>
          ) : null}
          <Link
            href="/ai"
            className="group flex items-center gap-2 rounded-full bg-electric px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c00500] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric xl:px-5 xl:text-[12px]"
          >
            <Asterisk size={14} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
            FRANCIS AI
            <ArrowUpRight size={13} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          className={cn('rounded-lg p-2 lg:hidden', light ? 'text-skylight' : 'text-navy')}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Cinematic scroll rail — fills as you move through the scenes */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-gradient-to-r from-[var(--accent)] via-[#ff8a00] to-[#ffd23f]"
        style={{ scaleX }}
      />

      {/* Mobile panel — same one-to-one section map */}
      {open && (
        <div className="fixed inset-x-0 top-[68px] bottom-0 z-40 bg-navy/97 backdrop-blur-xl lg:hidden">
          <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-10">
            {LINKS.map((link, i) => (
              <a
                key={link.id}
                href={`#${link.id}`}
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
              className="mt-2 flex items-center gap-3 rounded-full bg-electric px-8 py-4 font-display text-lg font-bold text-white"
            >
              <Asterisk size={18} /> Ask FRANCIS AI <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
