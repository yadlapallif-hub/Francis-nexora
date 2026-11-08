'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Magnetic button — gently attracted to the cursor while hovered.
 * Falls back to a plain button under reduced motion / coarse pointers.
 */
export function MagneticButton({
  children,
  className,
  href,
  onClick,
  ariaLabel,
  strength = 18,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setEnabled(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const handleMove = (e: React.MouseEvent) => {
    if (!enabled || reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setOffset({ x: relX * strength, y: relY * strength });
  };

  const reset = () => setOffset({ x: 0, y: 0 });

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.5 }}
      className={cn('inline-flex select-none', className)}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-electric rounded-full">
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-electric rounded-full">
      {inner}
    </button>
  );
}
