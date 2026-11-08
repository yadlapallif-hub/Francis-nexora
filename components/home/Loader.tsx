'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * SCENE 01 — Cinematic intro. The FRANCIS mark draws itself, the wordmark
 * resolves, the tagline lands — then the curtain lifts. ~2.4s total.
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.7, ease: 'easeInOut' } }}
          aria-hidden="true"
        >
          <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-30" />
          <div className="pointer-events-none absolute h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.28),transparent_68%)]" />

          <svg width="96" height="96" viewBox="0 0 64 64" className="relative">
            <motion.rect
              x="2" y="2" width="60" height="60" rx="15"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="200"
              initial={{ strokeDashoffset: 200, opacity: 0.2 }}
              animate={{ strokeDashoffset: 0, opacity: 1 }}
              transition={{ duration: 1.05, ease: 'easeInOut' }}
            />
            <motion.path
              d="M20 46V18h26v8H30v6h12v8H30v6z"
              fill="#2563EB"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '32px 32px' }}
            />
            <motion.circle
              cx="45" cy="45" r="4" fill="#EAF2FF"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.4, ease: 'backOut' }}
            />
          </svg>

          <div className="relative mt-8 overflow-hidden">
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
            className="relative mt-5 font-mono text-[10px] font-medium uppercase text-skylight/70 sm:text-[11px]"
          >
            Think · Create · Build · Innovate
          </motion.p>

          <div className="absolute bottom-10 left-1/2 h-px w-48 -translate-x-1/2 overflow-hidden bg-skylight/10">
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
