'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, ChevronRight, MapPin, GraduationCap, Sparkles } from 'lucide-react';
import ThreeBackdrop from '@/components/three/Backdrop';
import type { HeroHomepage, Profile } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

function Monogram() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 sm:h-28 sm:w-28" role="img" aria-label="FRANCIS monogram">
      <defs>
        <linearGradient id="intro-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#071B3A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#intro-g)" />
      <rect x="1.2" y="1.2" width="61.6" height="61.6" rx="14" fill="none" stroke="rgba(160,200,255,0.35)" strokeWidth="1.4" />
      <motion.path
        d="M20 16h26v9.5H31.5V31H44v9.5H31.5V50H20V16Z"
        fill="#EAF2FF"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.7 }}
      />
    </svg>
  );
}

export default function Hero({ homepage, profile }: { homepage: HeroHomepage; profile: Profile }) {
  const reduce = useReducedMotion();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (reduce) {
      setIntroDone(true);
      return;
    }
    const timer = window.setTimeout(() => setIntroDone(true), 2300);
    const skip = () => setIntroDone(true);
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('touchmove', skip, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
    };
  }, [reduce]);

  const lines = homepage.headline?.length ? homepage.headline : ['THINK.', 'CREATE.', 'BUILD.', 'INNOVATE.'];

  return (
    <section id="top" className="hero-scene noise relative min-h-[100svh] overflow-hidden text-white">
      {/* Backdrop layers */}
      <ThreeBackdrop />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,transparent_40%,rgba(4,14,34,0.55)_100%)]" />
      <div className="absolute inset-0 bg-[url('/images/hero-backdrop.jpg')] bg-cover bg-center opacity-25 mix-blend-screen" />
      <div className="hero-grid absolute inset-0" />

      {/* ── SCENE 1 · intro overlay ─────────────────────────── */}
      <AnimatePresence>
        {!introDone && (
          <motion.button
            key="intro"
            type="button"
            aria-label="Skip intro"
            onClick={() => setIntroDone(true)}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#040e22]"
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <Monogram />
            </motion.div>
            <div className="mt-8 flex gap-[0.18em] overflow-hidden" aria-hidden="true">
              {'FRANCIS'.split('').map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 90, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.085, duration: 0.75, ease: EASE }}
                  className="text-display text-5xl font-bold tracking-[0.18em] text-white sm:text-6xl"
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.2em' }}
              animate={{ opacity: 1, letterSpacing: '0.5em' }}
              transition={{ delay: 1.15, duration: 0.8 }}
              className="mt-5 font-mono text-[10px] uppercase text-blue-300/80 sm:text-[11px]"
            >
              Think · Create · Build · Innovate
            </motion.p>
            <motion.div className="mt-10 h-px w-44 overflow-hidden bg-white/10" aria-hidden="true">
              <motion.div className="h-full bg-gradient-to-r from-transparent via-electric to-transparent" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
            </motion.div>
            <span className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.4em] text-blue-200/40">Click to skip</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── SCENE 2 · cinematic hero ────────────────────────── */}
      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-24">
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: introDone ? 0.15 : 0, duration: 0.7 }}
            className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.42em] text-blue-300/90 sm:text-[11px]"
          >
            <span className="inline-block h-px w-10 bg-electric" /> {homepage.heroEyebrow}
          </motion.p>

          <h1 className="text-display mt-6 font-bold leading-[0.94]">
            {lines.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: '110%', rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.9, ease: EASE }}
                  className={`block text-[17vw] sm:text-8xl xl:text-[7.5rem] ${i === 3 ? 'text-outline' : 'text-white'}`}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-balance text-[15px] leading-relaxed text-blue-100/85 sm:text-lg">{homepage.subline}</p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#work" className="group flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-navy transition hover:bg-mist sm:text-[13px]">
              {homepage.ctaPrimary}
              <ArrowDown size={15} className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
            <Link href="/ai" className="group flex items-center gap-2 rounded-full border border-blue-300/35 px-6 py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-blue-100 transition hover:border-electric hover:bg-electric hover:text-white sm:text-[13px]">
              <Sparkles size={15} />
              {homepage.ctaSecondary}
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-3 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-200/75 sm:grid-cols-3 sm:gap-6 sm:text-[10.5px]">
            <div className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 shrink-0 text-electric" />
              <span>{profile.location ?? 'India'}</span>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap size={13} className="mt-0.5 shrink-0 text-electric" />
              <span>B.Tech CSE — {profile.college ?? 'Raghu Engineering College'}</span>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight size={13} className="mt-0.5 shrink-0 text-electric" />
              <span>{profile.previous_education ?? 'Diploma in Computer Engineering'}</span>
            </div>
          </dl>
        </div>

        {/* Portrait panel */}
        <div className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-md">
          <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-electric/25 blur-3xl" />
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.5, duration: 1.1, ease: EASE }}
            className="glass-dark animate-float relative overflow-hidden rounded-[2rem] p-3"
          >
            <div className="relative overflow-hidden rounded-[1.6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.avatar_url ?? '/images/francis-portrait.jpg'} alt="Portrait illustration of Yadlapalli Francis" className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040e22] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-display text-xl font-bold text-white">{profile.full_name}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-blue-200/85">{profile.title}</p>
              </div>
            </div>
          </motion.div>

          <a href="https://nexora-agent-site.vercel.app/?studio-check=db3087c" target="_blank" rel="noreferrer" className="glass-dark animate-float-late absolute -left-2 top-6 z-10 flex items-center gap-2 rounded-2xl px-4 py-2.5 transition hover:border-electric/60 sm:-left-8">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-400" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-blue-100">NEXORA AGENT · Live</span>
            <ArrowRight size={12} className="text-blue-300" />
          </a>
          <div className="glass-dark animate-float absolute -right-1 bottom-24 z-10 rounded-2xl px-4 py-2.5 sm:-right-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-blue-200/80">Currently</p>
            <p className="font-display text-xs font-semibold text-white">B.Tech CSE · Builder in public</p>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex" aria-hidden="true">
        <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-blue-200/60">Scroll · the film</span>
        <div className="flex h-12 w-6 items-start justify-center rounded-full border border-blue-300/30 p-1.5">
          <div className="h-2.5 w-1 animate-float rounded-full bg-electric" />
        </div>
      </div>
    </section>
  );
}
