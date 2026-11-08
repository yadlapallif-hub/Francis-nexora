'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * SCENE 01 — Cinematic intro. A motorsport-HUD blackout: the poster burns in
 * behind corner brackets and a scanning beam, the FRANCIS emblem spins up
 * (orbiting dash ring + gradient arc), the multicolour wordmark resolves —
 * then the curtain lifts. ~2.6s total. Reduced-motion users skip instantly.
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

  const corner = 'pointer-events-none absolute h-10 w-10 border-[#E10600]/80';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="francis-loader"
          className="fixed inset-0 z-[100] overflow-hidden bg-[#050505]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)', transition: { duration: 0.75, ease: 'easeInOut' } }}
          aria-hidden="true"
        >
          {/* Poster plate — slow Ken Burns push-in */}
          <motion.img
            src="/images/m4-grunge.jpg"
            alt=""
            initial={{ scale: 1.18, opacity: 0, filter: 'brightness(0.3) saturate(0.6)' }}
            animate={{ scale: 1.03, opacity: 1, filter: 'brightness(0.55) saturate(1.05)' }}
            transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[62%_38%]"
          />
          {/* Cinematic grade */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/50 to-[#050505]/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-[#050505]/60" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,5,5,0.78)_100%)]" />
          <div className="pointer-events-none absolute h-[560px] w-[880px] rounded-full bg-[radial-gradient(circle,rgba(225,6,0,0.25),transparent_70%)] blur-3xl" />

          {/* Scanning beam */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-[#E10600]/25 to-transparent" />

          {/* HUD corner brackets */}
          <div className={`${corner} left-4 top-4 border-l-2 border-t-2 sm:left-6 sm:top-6`} />
          <div className={`${corner} right-4 top-4 border-r-2 border-t-2 sm:right-6 sm:top-6`} />
          <div className={`${corner} bottom-4 left-4 border-b-2 border-l-2 sm:bottom-6 sm:left-6`} />
          <div className={`${corner} bottom-4 right-4 border-b-2 border-r-2 sm:bottom-6 sm:right-6`} />

          {/* HUD microtype */}
          <p className="absolute left-6 top-7 hidden font-mono text-[9px] font-medium uppercase tracking-[0.4em] text-white/55 sm:block sm:left-9 sm:top-9">
            17.6868°N — 83.2185°E<br />Visakhapatnam · India
          </p>
          <p className="absolute right-6 top-7 hidden text-right font-mono text-[9px] font-medium uppercase tracking-[0.4em] text-white/55 sm:right-9 sm:top-9 sm:block">
            Est. 2026<br />FRN-C / 001
          </p>
          <p className="absolute bottom-7 left-6 hidden font-mono text-[9px] font-medium uppercase tracking-[0.4em] text-white/45 sm:bottom-9 sm:left-9 sm:block">
            Portfolio · AI · Studio
          </p>
          <p className="absolute bottom-7 right-6 hidden font-mono text-[9px] font-medium uppercase tracking-[0.4em] text-[#ff5a3c] sm:bottom-9 sm:right-9 sm:block">
            Scene 01 / 09
          </p>

          {/* Emblem */}
          <div className="relative flex h-full flex-col items-center justify-center px-6">
            <div className="relative grid h-44 w-44 place-items-center sm:h-52 sm:w-52">
              {/* Outer dashed orbit */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-orbit-slow" aria-hidden="true">
                <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(245,245,244,0.16)" strokeWidth="0.6" strokeDasharray="2.4 5.2" />
                <circle cx="50" cy="50" r="47.5" fill="none" stroke="#E10600" strokeWidth="1.15" strokeLinecap="round" strokeDasharray="52 246" />
              </svg>
              {/* Counter-rotating inner arc */}
              <svg viewBox="0 0 100 100" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] animate-spin-slower" style={{ animationDirection: 'reverse' }} aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(225,6,0,0.85)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="70 400" opacity="0.9" />
              </svg>
              {/* Core emblem */}
              <svg width="112" height="112" viewBox="0 0 64 64" className="relative drop-shadow-[0_0_36px_rgba(225,6,0,0.5)]" role="img" aria-label="FRANCIS emblem">
                <defs>
                  <linearGradient id="f-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FF3D2E" />
                    <stop offset="0.55" stopColor="#E10600" />
                    <stop offset="1" stopColor="#8F0B00" />
                  </linearGradient>
                </defs>
                <motion.rect
                  x="3" y="3" width="58" height="58" rx="16"
                  fill="#0A0A0C" stroke="url(#f-grad)" strokeWidth="2.2"
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '32px 32px' }}
                />
                <motion.path
                  d="M20 46V18h26v8H30v6h12v8H30v6z" fill="url(#f-grad)"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '32px 32px' }}
                />
                <motion.circle
                  cx="45" cy="45" r="3.4" fill="#F5F5F4"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.78, duration: 0.4, ease: 'backOut' }}
                />
              </svg>
            </div>

            {/* Wordmark */}
            <div className="relative mt-7 overflow-hidden text-center">
              <motion.h1
                initial={{ y: 84, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.62, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="display-tight whitespace-nowrap text-6xl font-bold tracking-tight sm:text-7xl"
              >
                <span className="shimmer-multi">FRANCIS</span>
                <span className="text-electric">.</span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.42em' }}
              transition={{ delay: 0.95, duration: 0.9, ease: 'easeOut' }}
              className="relative mt-4 text-center font-mono text-[9px] font-medium uppercase text-white/75 sm:text-[11px]"
            >
              Think · Create · Build · Innovate
            </motion.p>
          </div>

          {/* Bottom progress hairline */}
          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#e10600] via-[#ff8a00] to-[#ffd23f] shadow-[0_0_18px_rgba(225,6,0,0.8)]"
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
