'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { HeroCanvas } from '@/components/three/HeroCanvas';
import { MagneticButton } from '@/components/fx/MagneticButton';
import type { HomepageSettings, Profile } from '@/lib/types';

export function Hero({ homepage, profile, nexoraLiveUrl }: { homepage: HomepageSettings; profile: Profile; nexoraLiveUrl?: string | null }) {
  const reduce = useReducedMotion();
  const lines = homepage.headline;

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-navy text-skylight" id="top" aria-label="FRANCIS — introduction">
      {/* Backdrop — the seaside photograph (Visakhapatnam coast) */}
      <img
        src="/images/seaside.jpg"
        alt="Seaside coastline at low tide — the horizon Francis looks out from"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[58%_34%] opacity-95"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy via-navy/15 to-navy/55" />
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-20" />

      {/* 3D object */}
      <HeroCanvas className="pointer-events-auto absolute inset-y-0 right-[-14%] hidden w-[62%] md:block" />

      {/* Scene content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pb-28 md:pt-40">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 2.1, duration: 0.7 }}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.45em] text-electric sm:text-[11px]"
        >
          {homepage.heroEyebrow}
        </motion.p>

        <h1 className="display-tight mt-5 font-bold text-white" aria-label={lines.join(' ')}>
          {lines.map((line, i) => (
            <span key={i} className="block overflow-hidden pb-1">
              <motion.span
                className="block text-[clamp(3.2rem,12.5vw,8.2rem)]"
                initial={{ y: reduce ? 0 : '108%', opacity: reduce ? 1 : 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: reduce ? 0 : 2.15 + i * 0.14, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              >
                {i === lines.length - 1 ? (
                  <>
                    {line.replace(/\.$/, '')}
                    <span className="text-electric">.</span>
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-7 flex max-w-2xl flex-col gap-6 md:mt-9 md:flex-row md:items-end md:gap-10">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 2.75, duration: 0.75 }}
            className="max-w-md text-[15px] leading-7 text-skylight/85"
          >
            {homepage.subline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 2.9, duration: 0.75 }}
            className="flex shrink-0 flex-wrap items-center gap-3"
          >
            <MagneticButton href="#work" ariaLabel="Explore the work">
              <span className="inline-flex items-center rounded-full bg-electric px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.18em] text-white shadow-glowsm transition-colors hover:bg-[#0B6E7D]">
                {homepage.ctaPrimary}
              </span>
            </MagneticButton>
            <MagneticButton href="/ai" ariaLabel="Ask FRANCIS AI" strength={22}>
              <span className="inline-flex items-center gap-2 rounded-full border border-skylight/30 bg-white/5 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.18em] text-skylight backdrop-blur transition-colors hover:border-skylight/60 hover:text-white">
                <Sparkles size={14} /> {homepage.ctaSecondary}
              </span>
            </MagneticButton>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 3.1, duration: 0.9 }}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-medium uppercase tracking-[0.22em] text-skylight/60"
        >
          <span className="inline-flex items-center gap-2"><MapPin size={12} className="text-electric" /> Visakhapatnam, IN</span>
          <span className="hidden h-1 w-1 rounded-full bg-skylight/30 sm:inline-block" />
          <span>B.Tech CSE — Raghu Engineering College</span>
          <span className="hidden h-1 w-1 rounded-full bg-skylight/30 sm:inline-block" />
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-400" /> Open to internships
          </span>
        </motion.div>
      </div>

      {/* Floating NEXORA live card */}
      {nexoraLiveUrl ? (
        <a
          href={nexoraLiveUrl}
          target="_blank"
          rel="noreferrer"
          className="group absolute bottom-24 right-5 z-10 hidden items-center gap-3 rounded-2xl border border-skylight/15 bg-navy/60 p-3 pr-5 backdrop-blur-xl transition hover:border-electric/60 hover:bg-navy/80 lg:flex"
          aria-label="Open NEXORA AGENT live"
        >
          <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-electric/40 bg-electric/15">
            <span className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,rgba(14,138,156,0.45),transparent_70%)]" />
            <span className="relative h-3.5 w-3.5 rounded-sm bg-electric shadow-glowsm" />
          </span>
          <span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.35em] text-electric">Live — NEXORA AGENT</span>
            <span className="mt-1 block text-[12px] font-semibold text-white">View the featured project <ExternalLink size={11} className="inline" /></span>
          </span>
        </a>
      ) : null}

      {/* Scroll cue */}
      <a href="#about" className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-skylight/55 transition hover:text-white" aria-label="Scroll to about">
        <span className="font-mono text-[9px] uppercase tracking-[0.5em]">Scroll</span>
        <motion.span animate={reduce ? {} : { y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <ArrowDown size={15} />
        </motion.span>
      </a>
    </section>
  );
}
