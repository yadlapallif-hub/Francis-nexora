'use client';

import { useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * SCENE 02B — Cinematic kinetic type slides.
 * A pinned 4-beat interlude between the hero and the about section:
 * THINK. CREATE. BUILD. INNOVATE. — each word lands like a film cut,
 * inside a letterboxed frame. Scroll-driven; reduced-motion users get a
 * static stack instead.
 */
const SLIDES = [
  {
    index: '01',
    word: 'THINK',
    bg: '#0A0A0C',
    wordColor: 'transparent',
    stroke: '1.6px #F5F5F4',
    dot: '#E10600',
    ghost: 'rgba(245,245,244,0.05)',
    ghostColor: '#F5F5F4',
    micro: 'Scene 01 — The Question',
    caption: 'Every build starts with why.',
    tone: 'dark' as const,
  },
  {
    index: '02',
    word: 'CREATE',
    bg: '#FAFAF9',
    wordColor: '#0A0A0C',
    stroke: undefined as string | undefined,
    dot: '#E10600',
    ghost: 'rgba(10,10,12,0.055)',
    ghostColor: '#0A0A0C',
    micro: 'Scene 02 — The Spark',
    caption: 'Taste, craft and intention.',
    tone: 'light' as const,
  },
  {
    index: '03',
    word: 'BUILD',
    bg: '#0A0A0C',
    wordColor: '#E10600',
    stroke: undefined as string | undefined,
    dot: '#F5F5F4',
    ghost: 'rgba(225,6,0,0.07)',
    ghostColor: '#E10600',
    micro: 'Scene 03 — The Discipline',
    caption: 'Systems, engineered and shipped.',
    tone: 'dark' as const,
  },
  {
    index: '04',
    word: 'INNOVATE',
    bg: '#E10600',
    wordColor: '#0A0A0C',
    stroke: undefined as string | undefined,
    dot: '#FAFAF9',
    ghost: 'rgba(10,10,12,0.09)',
    ghostColor: '#0A0A0C',
    micro: 'Scene 04 — The Impact',
    caption: 'Useful, fast, beautiful.',
    tone: 'light' as const,
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

function SlideFrame({ slide }: { slide: (typeof SLIDES)[number] }) {
  const light = slide.tone === 'light';
  return (
    <>
      {/* Ghost index numeral */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 select-none font-display text-[36vw] font-bold leading-none sm:-right-6 sm:text-[30vw]"
        style={{ color: slide.ghost }}
      >
        {slide.index}
      </span>

      {/* Faint grid on dark beats */}
      {!light && <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-20" />}

      {/* Letterbox bars — always black, always cinema */}
      <div className="absolute inset-x-0 top-0 z-20 flex h-9 items-center justify-between border-b border-white/5 bg-black px-4 font-mono text-[8px] font-semibold uppercase tracking-[0.4em] text-white/55 sm:h-11 sm:px-8 sm:text-[9px]">
        <span>FRN — Cinema Reel</span>
        <span className="hidden sm:inline">Think · Create · Build · Innovate</span>
        <span className="text-[#E10600]">FRANCIS / 001</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-9 items-center justify-between border-t border-white/5 bg-black px-4 font-mono text-[8px] font-semibold uppercase tracking-[0.4em] text-white/55 sm:h-11 sm:px-8 sm:text-[9px]">
        <span>{slide.micro}</span>
        <span className="hidden sm:inline">Red on black · White on red</span>
        <span>{slide.index} / 04</span>
      </div>

      {/* The word */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="overflow-hidden px-2 pb-3">
          <AnimatePresence initial={false}>
            <motion.h2
              key={slide.word}
            initial={{ y: '118%', rotate: 3, opacity: 0.35 }}
            animate={{ y: '0%', rotate: 0, opacity: 1 }}
            exit={{ y: '-118%', opacity: 0 }}
            transition={{ duration: 0.72, ease: EASE }}
            aria-label={slide.word}
            className="display-tight whitespace-nowrap font-display text-[clamp(3.6rem,15.5vw,12rem)] font-bold leading-[0.95] tracking-tight"
            style={{
              color: slide.wordColor,
              WebkitTextStroke: slide.stroke,
              textShadow: slide.word === 'BUILD' ? '0 0 80px rgba(225,6,0,0.45)' : undefined,
            }}
          >
              {slide.word}
              <span style={{ color: slide.dot, WebkitTextStroke: '0px transparent' }}>.</span>
            </motion.h2>
          </AnimatePresence>
        </div>
      </div>

      {/* Microtype caption — lower left, above the letterbox */}
      <div className="absolute bottom-14 left-5 z-10 sm:bottom-[4.5rem] sm:left-10">
        <div className="mb-2 h-px w-14 bg-[#E10600]" aria-hidden="true" />
        <p className={cn('font-mono text-[8px] font-bold uppercase tracking-[0.4em] sm:text-[9px]', light ? 'text-[#0A0A0C]/55' : 'text-white/55')}>
          {slide.micro}
        </p>
        <p className={cn('mt-1.5 max-w-[240px] font-body text-[12px] font-medium leading-5 sm:max-w-xs sm:text-[13px]', light ? 'text-[#0A0A0C]/80' : 'text-white/75')}>
          {slide.caption}
        </p>
      </div>

      {/* Progress ticks — lower right, above the letterbox */}
      <div className="absolute bottom-14 right-5 z-10 flex items-center gap-2 sm:bottom-[4.5rem] sm:right-10" aria-hidden="true">
        {SLIDES.map((s) => (
          <span
            key={s.index}
            className={cn(
              'h-[3px] w-7 rounded-full transition-all duration-500 sm:w-9',
              s.index === slide.index ? 'bg-[#E10600] shadow-[0_0_12px_rgba(225,6,0,0.8)]' : light ? 'bg-black/20' : 'bg-white/20'
            )}
          />
        ))}
      </div>

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </>
  );
}

export function KineticSlides() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const i = Math.min(SLIDES.length - 1, Math.max(0, Math.floor(v * SLIDES.length)));
    if (i !== active) setActive(i);
  });

  // Reduced motion — a calm static stack of the four beats.
  if (reduce) {
    return (
      <section aria-label="FRANCIS — Think. Create. Build. Innovate." className="bg-[#0A0A0C]">
        {SLIDES.map((slide) => (
          <div
            key={slide.index}
            className="flex min-h-[46vh] flex-col justify-center overflow-hidden px-6 py-14 sm:px-12"
            style={{ background: slide.bg }}
          >
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#E10600]">{slide.micro}</p>
            <p
              className="display-tight mt-3 font-display text-[clamp(3rem,13vw,9rem)] font-bold leading-[0.95]"
              style={{ color: slide.wordColor === 'transparent' ? slide.ghostColor : slide.wordColor, WebkitTextStroke: slide.stroke }}
            >
              {slide.word}
              <span style={{ color: slide.dot }}>.</span>
            </p>
            <p className={cn('mt-3 max-w-xs text-[13px]', slide.tone === 'light' ? 'text-black/70' : 'text-white/70')}>{slide.caption}</p>
          </div>
        ))}
      </section>
    );
  }

  const slide = SLIDES[active];

  return (
    <section ref={sectionRef} aria-label="FRANCIS — Think. Create. Build. Innovate." className="relative h-[440vh] bg-[#0A0A0C]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Slide background cuts */}
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.index}
            className="absolute inset-0"
            style={{ background: slide.bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
          />
        </AnimatePresence>

        <SlideFrame slide={slide} />
      </div>
    </section>
  );
}
