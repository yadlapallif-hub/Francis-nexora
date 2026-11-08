'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * SCENE 01 — Cinematic intro. The BMW M4 grunge plate burns in behind the
 * FRANCIS mark drawing itself, the wordmark resolving, the tagline landing —
 * then the curtain lifts. ~2.4s total.
 */
export function Loader() {
  const [show, setShow] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(false), 2400);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="francis-loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.7, ease: 'easeInOut' } }}
          aria-hidden="true"
        >
          {/* Poster plate — slow Ken Burns drift */}
          <motion.img
            src="/images/m4-grunge.jpg"
            alt=""
            initial={{ scale: 1.18, opacity: 0, filter: 'brightness(0.35) saturate(0.7)' }}
            animate={{ scale: 1.02, opacity: 1, filter: 'brightness(0.62) saturate(1.05)' }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[62%_38%]"
          />
          {/* Cinematic grade: deep black falloff, ember glow from the red paint */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505]/92 via-[#050505]/45 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-[#050505]/55" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,5,5,0.72)_100%)]" />
          <div className="pointer-events-none absolute h-[520px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(225,6,0,0.22),transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-20" />

          <svg width="96" height="96" viewBox="0 0 64 64" className="relative drop-shadow-[0_0_28px_rgba(225,6,0,0.45)]">
            <motion.rect
              x="2" y="2" width="60" height="60" rx="15"
              fill="none"
              stroke="#E10600"
              strokeWidth="2.5"
              strokeDasharray="200"
              initial={{ strokeDashoffset: 200, opacity: 0.2 }}
              animate={{ strokeDashoffset: 0, opacity: 1 }}
              transition={{ duration: 1.05, ease: 'easeInOut' }}
            />
            <motion.path
              d="M20 46V18h26v8H30v6h12v8H30v6z"
              fill="#E10600"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '32px 32px' }}
            />
            <motion.circle
              cx="45" cy="45" r="4" fill="#F5F5F4"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.4, ease: 'backOut' }}
            />
          </svg>

          <div className="relative mt-8 overflow-hidden px-4 text-center">
            <motion.h1
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="display-tight text-5xl font-bold text-white sm:text-6xl"
            >
              FRANCIS<span className="text-electric">.</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.9em' }}
            animate={{ opacity: 1, letterSpacing: '0.42em' }}
            transition={{ delay: 1.05, duration: 0.9, ease: 'easeOut' }}
            className="relative mt-5 px-4 text-center font-mono text-[10px] font-medium uppercase text-white/80 sm:text-[11px]"
          >
            Think · Create · Build · Innovate
          </motion.p>

          <div className="absolute bottom-10 left-1/2 h-px w-48 -translate-x-1/2 overflow-hidden bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-electric to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ delay: 0.35, duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
