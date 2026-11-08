'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * SCENE 01 — Cinematic intro (light edition). Ivory blackout plate, red HUD
 * brackets, orbiting dash ring, multicolour FRANCIS wordmark — with the
 * M4 grunge poster presented as a framed cover-car plate on the right.
 * ~2.6s total. Reduced-motion users skip instantly.
 */
export function Loader() {
  const [show, setShow] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(false), 2600);
    return () => window.clearTimeout(t);
  }, [reduce]);

  const corner = 'pointer-events-none absolute h-10 w-10 border-[#E10600]';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="francis-loader"
          className="fixed inset-0 z-[100] overflow-hidden bg-[#FAFAF9]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.75, ease: 'easeInOut' } }}
          aria-hidden="true"
        >
          {/* Light grade: warm paper, faint red grid, soft ember glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_700px_at_72%_38%,rgba(225,6,0,0.10),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_600px_at_12%_82%,rgba(225,6,0,0.08),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-[0.55]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{ backgroundImage: 'radial-gradient(rgba(10,10,12,0.08) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
          />

          {/* Scanning beam — soft red */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-[#E10600]/15 to-transparent" />

          {/* HUD corner brackets — red on ivory */}
          <div className={`${corner} left-4 top-4 border-l-2 border-t-2 sm:left-6 sm:top-6`} />
          <div className={`${corner} right-4 top-4 border-r-2 border-t-2 sm:right-6 sm:top-6`} />
          <div className={`${corner} bottom-4 left-4 border-b-2 border-l-2 sm:bottom-6 sm:left-6`} />
          <div className={`${corner} bottom-4 right-4 border-b-2 border-r-2 sm:bottom-6 sm:right-6`} />

          {/* HUD microtype */}
          <p className="absolute left-6 top-7 hidden font-mono text-[9px] font-semibold uppercase tracking-[0.4em] text-[#0A0A0C]/55 sm:left-9 sm:top-9 sm:block">
            17.6868°N — 83.2185°E<br />Visakhapatnam · India
          </p>
          <p className="absolute right-6 top-7 hidden text-right font-mono text-[9px] font-semibold uppercase tracking-[0.4em] text-[#0A0A0C]/55 sm:right-9 sm:top-9 sm:block">
            Est. 2026<br />FRN-C / 001
          </p>
          <p className="absolute bottom-7 left-6 hidden font-mono text-[9px] font-semibold uppercase tracking-[0.4em] text-[#0A0A0C]/45 sm:bottom-9 sm:left-9 sm:block">
            Portfolio · AI · Studio
          </p>
          <p className="absolute bottom-7 right-6 hidden font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#E10600] sm:bottom-9 sm:right-9 sm:block">
            Scene 01 / 09
          </p>

          {/* Framed cover-car plate */}
          <motion.figure
            initial={{ opacity: 0, x: 120, rotate: 4 }}
            animate={{ opacity: 1, x: 0, rotate: -1.2 }}
            transition={{ delay: 0.25, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute right-[6%] top-1/2 hidden w-[34%] max-w-[560px] -translate-y-1/2 lg:block"
          >
            <div className="rotate-0 rounded-2xl border-2 border-[#0A0A0C] bg-white p-2.5 shadow-[10px_12px_0_0_#0A0A0C]">
              <img
                src="/images/m4-grunge.jpg"
                alt=""
                className="h-[46vh] w-full rounded-xl object-cover object-[62%_36%]"
              />
              <figcaption className="flex items-center justify-between px-2 pb-1.5 pt-2.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-[#0A0A0C]/70">Cover car</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-[#E10600]">BMW M4 · 93</span>
              </figcaption>
            </div>
          </motion.figure>

          {/* Emblem + wordmark */}
          <div className="relative flex h-full flex-col items-center justify-center px-6 lg:items-start lg:pl-[9%]">
            <div className="relative grid h-36 w-36 place-items-center sm:h-44 sm:w-44">
              {/* Outer dashed orbit */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-orbit-slow" aria-hidden="true">
                <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(10,10,12,0.18)" strokeWidth="0.7" strokeDasharray="2.4 5.2" />
                <circle cx="50" cy="50" r="47.5" fill="none" stroke="#E10600" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="52 246" />
              </svg>
              {/* Counter-rotating inner arc */}
              <svg viewBox="0 0 100 100" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] animate-spin-slower" style={{ animationDirection: 'reverse' }} aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(225,6,0,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="70 400" opacity="0.95" />
              </svg>
              {/* Core emblem — black squircle, red F */}
              <svg width="100" height="100" viewBox="0 0 64 64" className="relative drop-shadow-[0_18px_38px_rgba(225,6,0,0.35)]" role="img" aria-label="FRANCIS emblem">
                <defs>
                  <linearGradient id="f-grad-light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FF3D2E" />
                    <stop offset="0.55" stopColor="#E10600" />
                    <stop offset="1" stopColor="#8F0B00" />
                  </linearGradient>
                </defs>
                <motion.rect
                  x="3" y="3" width="58" height="58" rx="16"
                  fill="#0A0A0C" stroke="url(#f-grad-light)" strokeWidth="2.4"
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '32px 32px' }}
                />
                <motion.path
                  d="M20 46V18h26v8H30v6h12v8H30v6z" fill="url(#f-grad-light)"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '32px 32px' }}
                />
                <motion.circle
                  cx="45" cy="45" r="3.4" fill="#FAFAF9"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.78, duration: 0.4, ease: 'backOut' }}
                />
              </svg>
            </div>

            {/* Wordmark — black multicolour sweep + red dot */}
            <div className="relative mt-6 overflow-hidden text-center lg:text-left">
              <motion.h1
                initial={{ y: 84, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.62, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="display-tight whitespace-nowrap text-6xl font-bold tracking-tight sm:text-7xl xl:text-8xl"
              >
                <span className="shimmer-multi-dark">FRANCIS</span>
                <span className="text-electric">.</span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.42em' }}
              transition={{ delay: 0.95, duration: 0.9, ease: 'easeOut' }}
              className="relative mt-4 text-center font-mono text-[9px] font-semibold uppercase text-[#0A0A0C]/65 sm:text-[11px] lg:text-left"
            >
              Think · Create · Build · Innovate
            </motion.p>

            {/* Signature strip */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.7 }}
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#0A0A0C]/15 bg-white/70 px-4 py-2 backdrop-blur lg:self-start"
            >
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#E10600]" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-[#0A0A0C]/70">Yadlapalli Francis — Portfolio 001</span>
            </motion.div>
          </div>

          {/* Bottom progress hairline */}
          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/8">
            <motion.div
              className="h-full bg-gradient-to-r from-[#e10600] via-[#ff8a00] to-[#ffd23f] shadow-[0_0_18px_rgba(225,6,0,0.55)]"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 2.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
