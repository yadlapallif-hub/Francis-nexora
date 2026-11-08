'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

const SCENES = [
  { id: 'top', index: '01', label: 'Intro' },
  { id: 'about', index: '02', label: 'About' },
  { id: 'skills', index: '03', label: 'Skills' },
  { id: 'education', index: '04', label: 'Education' },
  { id: 'work', index: '05', label: 'Work' },
  { id: 'experience', index: '06', label: 'Career' },
  { id: 'contact', index: '07', label: 'Contact' },
];

/**
 * SCENE RAIL — a fixed cinematic index on the right edge. The active scene
 * ignites in racing red; every dot glides you to that scene. Desktop only.
 */
export function SceneDots() {
  const [active, setActive] = useState('top');

  useEffect(() => {
    const sections = SCENES.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-38% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Scene navigation"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
    >
      <span className="h-10 w-px bg-gradient-to-b from-transparent via-white/25 to-white/40 mix-blend-difference" aria-hidden="true" />
      {SCENES.map((scene) => {
        const isActive = active === scene.id;
        return (
          <button
            key={scene.id}
            onClick={() => jump(scene.id)}
            aria-label={`Scene ${scene.index} — ${scene.label}`}
            aria-current={isActive ? 'true' : undefined}
            className="group relative flex h-5 items-center outline-none"
          >
            <span
              className={cn(
                'pointer-events-none absolute right-6 whitespace-nowrap rounded-md border border-white/10 bg-black/85 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-white/90 opacity-0 backdrop-blur transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
                isActive && 'opacity-100 translate-x-0'
              )}
            >
              <span className="text-[#3AD2DE]">{scene.index}</span> · {scene.label}
            </span>
            <span
              className={cn(
                'block rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isActive
                  ? 'h-6 w-[5px] bg-[#0E8A9C] shadow-[0_0_14px_rgba(14,138,156,0.9)]'
                  : 'h-[5px] w-[5px] bg-white/55 mix-blend-difference group-hover:bg-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.6)]'
              )}
            />
          </button>
        );
      })}
      <span className="h-10 w-px bg-gradient-to-t from-transparent via-white/25 to-white/40 mix-blend-difference" aria-hidden="true" />
    </nav>
  );
}
