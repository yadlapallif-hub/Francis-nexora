'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function Reveal({
  children,
  delay = 0,
  y = 44,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SceneHeading({
  scene,
  kicker,
  title,
  light = false,
}: {
  scene: string;
  kicker: string;
  title: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="mb-12">
      <p className={`font-mono text-[10px] uppercase tracking-[0.45em] ${light ? 'text-blue-300/80' : 'text-electric'}`}>
        Scene {scene} <span className="opacity-50">/ 09</span> — {kicker}
      </p>
      <h2 className={`text-display mt-4 max-w-3xl text-4xl font-bold leading-[1.02] sm:text-6xl ${light ? 'text-white' : 'text-navy'}`}>{title}</h2>
    </div>
  );
}
