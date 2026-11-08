'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/brand';

const LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Work', href: '/#work' },
  { label: 'Contact', href: '/#contact' },
];

export default function NavBar({ resumeUrl }: { resumeUrl?: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-all duration-500 sm:px-6 ${
          scrolled ? 'my-2 rounded-2xl border border-white/10 bg-[#050f24]/80 py-2 shadow-[0_10px_40px_-15px_rgba(0,10,40,0.8)] backdrop-blur-xl' : 'py-4'
        }`}
      >
        <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="FRANCIS — home">
          <LogoMark size={38} />
          <span className="leading-tight">
            <span className="block font-display text-base font-bold tracking-[0.22em] text-white">FRANCIS</span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.34em] text-blue-300/80">Think · Create · Build</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="font-mono text-[11px] uppercase tracking-[0.28em] text-blue-100/75 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {resumeUrl ? (
            <a href={resumeUrl} target="_blank" rel="noreferrer" aria-label="Resume" className="hidden items-center gap-2 rounded-full border border-blue-300/25 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-blue-100/85 transition hover:border-blue-300/60 hover:text-white sm:flex">
              <FileText size={13} /> Resume
            </a>
          ) : null}
          <Link href="/ai" className="btn-shine flex items-center gap-2 rounded-full bg-electric px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_-6px_rgba(37,99,235,0.8)] transition hover:bg-blue-500">
            <Sparkles size={13} /> Ask FRANCIS AI
          </Link>
          <Link href="/admin" aria-label="Admin control studio" title="Admin control studio" className="rounded-full border border-white/10 p-2 text-blue-100/70 transition hover:border-blue-300/40 hover:text-white">
            <ShieldCheck size={17} />
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-white/10 p-2 text-blue-100 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-4 mt-1 rounded-2xl border border-white/10 bg-[#050f24]/95 p-5 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="font-mono text-xs uppercase tracking-[0.3em] text-blue-100/85">
                {link.label}
              </a>
            ))}
            <Link href="/ai" onClick={() => setOpen(false)} className="font-mono text-xs uppercase tracking-[0.3em] text-electric">
              FRANCIS AI →
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
