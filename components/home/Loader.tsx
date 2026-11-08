'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * SCENE 01 — Cinematic intro (Bay of Bengal edition). Full-bleed seaside
 * photograph, abyssal gradient grade, seafoam HUD brackets, orbiting dash
 * rings, multicolour ocean wordmark. ~2.6s total. Reduced-motion users skip.
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

  const corner = 'pointer-events-none absolute h-10 w-10 border-[#3AD2DE]';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="francis-loader"
          className="fixed inset-0 z-[100] overflow-hidden bg-[#062A3A]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.75, ease: 'easeInOut' } }}
          aria-hidden="true"
        >
          {/* Full-bleed seaside photograph — the new cover scene */}
          <img
            src="/images/seaside.jpg"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[58%_34%]"
          />
          {/* Abyssal grade: left for the emblem, bottom for the progress rail */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#062A3A] via-[#062A3A]/72 to-[#062A3A]/5" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062A3A] via-[#062A3A]/20 to-[#062A3A]/55" />
          {/* Faint sea-grid + tide mist */}
          <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-20" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_620px_at_78%_22%,rgba(58,210,222,0.16),transparent_65%)]" />

          {/* Scanning beam — seafoam */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-[#3AD2DE]/18 to-transparent" />

          {/* HUD corner brackets */}
          <div className={`${corner} left-4 top-4 border-l-2 border-t-2 opacity-90 sm:left-6 sm:top-6`} />
          <div className={`${corner} right-4 top-4 border-r-2 border-t-2 opacity-90 sm:right-6 sm:top-6`} />
          <div className={`${corner} bottom-4 left-4 border-b-2 border-l-2 opacity-90 sm:bottom-6 sm:left-6`} />
          <div className={`${corner} bottom-4 right-4 border-b-2 border-r-2 opacity-90 sm:bottom-6 sm:right-6`} />

          {/* HUD microtype */}
          <p className="absolute left-6 top-7 hidden font-mono text-[9px] font-semibold uppercase tracking-[0.4em] text-[#F2F7F7]/70 sm:left-9 sm:top-9 sm:block">
            17.6868°N — 83.2185°E<br />Visakhapatnam · India
          </p>
          <p className="absolute right-6 top-7 hidden text-right font-mono text-[9px] font-semibold uppercase tracking-[0.4em] text-[#F2F7F7]/70 sm:right-9 sm:top-9 sm:block">
            Bay of Bengal<br />Scene 01 / 09
          </p>
          <p className="absolute bottom-7 left-6 hidden font-mono text-[9px] font-semibold uppercase tracking-[0.4em] text-[#F2F7F7]/55 sm:bottom-9 sm:left-9 sm:block">
            Portfolio · AI · Studio
          </p>
          <p className="absolute bottom-7 right-6 hidden font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#3AD2DE] sm:bottom-9 sm:right-9 sm:block">
            Home — Coast
          </p>

          {/* Location caption chip — where the photograph was taken */}
          <motion.div
            initial={{ opacity: 0, x: 120, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: -1 }}
            transition={{ delay: 0.35, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute bottom-[18%] right-[6%] hidden rounded-2xl border border-[#3AD2DE]/35 bg-[#062A3A]/55 px-4 py-3 backdrop-blur-md lg:block"
          >
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.4em] text-[#3AD2DE]">Cover frame</p>
            <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F2F7F7]/85">Sea coast · Morning tide</p>
          </motion.div>

          {/* Emblem + wordmark */}
          <div className="relative flex h-full flex-col items-center justify-center px-6 lg:items-start lg:pl-[9%]">
            <div className="relative grid h-36 w-36 place-items-center sm:h-44 sm:w-44">
              {/* Outer dashed orbit */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-orbit-slow" aria-hidden="true">
                <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(242,247,247,0.22)" strokeWidth="0.7" strokeDasharray="2.4 5.2" />
                <circle cx="50" cy="50" r="47.5" fill="none" stroke="#3AD2DE" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="52 246" />
              </svg>
              {/* Counter-rotating inner arc */}
              <svg viewBox="0 0 100 100" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] animate-spin-slower" style={{ animationDirection: 'reverse' }} aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(58,210,222,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="70 400" opacity="0.95" />
              </svg>
              {/* Core emblem — abyss squircle, sea-teal F */}
              <svg width="100" height="100" viewBox="0 0 64 64" className="relative drop-shadow-[0_18px_38px_rgba(58,210,222,0.4)]" role="img" aria-label="FRANCIS emblem">
                <defs>
                  <linearGradient id="f-grad-sea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#7FE3EC" />
                    <stop offset="0.55" stopColor="#0E8A9C" />
                    <stop offset="1" stopColor="#0B5E6D" />
                  </linearGradient>
                </defs>
                <motion.rect
                  x="3" y="3" width="58" height="58" rx="16"
                  fill="#062A3A" stroke="url(#f-grad-sea)" strokeWidth="2.4"
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '32px 32px' }}
                />
                <motion.path
                  d="M20 46V18h26v8H30v6h12v8H30v6z" fill="url(#f-grad-sea)"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '32px 32px' }}
                />
                <motion.circle
                  cx="45" cy="45" r="3.4" fill="#F2F7F7"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.78, duration: 0.4, ease: 'backOut' }}
                />
              </svg>
            </div>

            {/* Wordmark — ocean multicolour sweep + teal dot */}
            <div className="relative mt-6 overflow-hidden text-center lg:text-left">
              <motion.h1
                initial={{ y: 84, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.62, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="display-tight whitespace-nowrap text-6xl font-bold tracking-tight sm:text-7xl xl:text-8xl"
              >
                <span className="shimmer-multi">FRANCIS</span>
                <span className="text-[#3AD2DE]">.</span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.42em' }}
              transition={{ delay: 0.95, duration: 0.9, ease: 'easeOut' }}
              className="relative mt-4 text-center font-mono text-[9px] font-semibold uppercase text-[#F2F7F7]/80 sm:text-[11px] lg:text-left"
            >
              Think · Create · Build · Innovate
            </motion.p>

            {/* Signature strip */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.7 }}
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#3AD2DE]/30 bg-[#062A3A]/55 px-4 py-2 backdrop-blur lg:self-start"
            >
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#3AD2DE]" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-[#F2F7F7]/80">Yadlapalli Francis — Portfolio 001</span>
            </motion.div>
          </div>

          {/* Bottom progress hairline — seafoam to sand */}
          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-[#0E8A9C] via-[#3AD2DE] to-[#E4D5B4] shadow-[0_0_18px_rgba(58,210,222,0.6)]"
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
