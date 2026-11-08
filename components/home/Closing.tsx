'use client';

import Link from 'next/link';
import { ArrowRight, Asterisk } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

/** SCENE 08/09 — the final brand frame. */
export function Closing() {
  const reduce = useReducedMotion();
  return (
    <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden bg-navy text-center text-skylight" aria-label="FRANCIS — closing frame">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-electric/25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-skylight/10" />
      <div className="relative flex w-full flex-col items-center px-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.5em] text-electric sm:text-[11px]">Final cut</p>
        <h2 className="display-tight mt-6 text-[clamp(4.5rem,19vw,13rem)] leading-none">
          <span className="text-skylight">FRANCIS</span><span className="text-electric">.</span>
        </h2>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.42em] text-skylight/65 sm:text-xs">
          Think · Create · Build · Innovate
        </p>
        <motion.img
          src="/images/francis-portrait.jpg"
          alt="Yadlapalli Francis"
          width={96}
          height={96}
          initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: reduce ? 0 : 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 h-24 w-24 rounded-2xl border border-white/15 object-cover object-top shadow-[8px_8px_0_0_var(--accent)]"
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: reduce ? 0 : 0.5, duration: 1.1 }}
          className="mt-6 max-w-md text-sm leading-7 text-skylight/70"
        >
          A cinematic portfolio. A general-purpose AI. A studio that ships — one disciplined system at a time.
        </motion.p>
        <Link href="/ai" className="group mt-10 inline-flex items-center gap-3 rounded-full bg-electric px-9 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#c00500]">
          <Asterisk size={17} /> Talk to FRANCIS AI <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
        </Link>
      </div>
      <div className="absolute bottom-5 left-1/2 w-full -translate-x-1/2 overflow-hidden opacity-[0.13]" aria-hidden="true">
        <div className="flex w-max animate-marquee whitespace-nowrap font-serif italic text-7xl font-semibold text-skylight">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="pr-8">THINK · CREATE · BUILD · INNOVATE · FRANCIS · </span>
          ))}
        </div>
      </div>
    </section>
  );
}
