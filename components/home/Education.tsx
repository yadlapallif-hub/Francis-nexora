'use client';

import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, BookOpen } from 'lucide-react';
import { SceneTag } from './SceneTag';
import type { EducationItem } from '@/lib/types';

export function Education({ education }: { education: EducationItem[] }) {
  return (
    <section id="education" className="relative bg-white py-24 sm:py-32" aria-label="Education">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SceneTag index="04" label="Education" />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display-tight text-4xl font-bold text-navy sm:text-6xl">
            Learning in<br /><span className="shimmer-text">public.</span>
          </h2>
          <p className="max-w-xs font-mono text-[10px] uppercase leading-5 tracking-[0.25em] text-ink/40">
            Education.log // updated from the control studio
          </p>
        </div>

        <ol className="relative mt-16 max-w-4xl border-l-2 border-skylight pl-8 sm:pl-14">
          {education.map((item, index) => {
            const current = (item.status ?? '').toLowerCase().includes('pursu');
            return (
              <li key={item.id} className="group relative pb-12 last:pb-0">
                <span
                  className="absolute -left-[42px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-electric bg-white sm:-left-[66px] sm:h-6 sm:w-6"
                  aria-hidden="true"
                >
                  {current && <span className="h-2 w-2 animate-pulse-dot rounded-full bg-electric sm:h-2.5 sm:w-2.5" />}
                </span>
                <motion.div initial={{ opacity: 0, x: index % 2 === 0 ? -64 : 64 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="card-outline rounded-2xl border border-navy/8 bg-mist p-6 transition-all duration-300 group-hover:border-electric/35 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy p-3.5 text-skylight">
                        <GraduationCap size={24} strokeWidth={1.7} />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-navy sm:text-2xl">{item.degree}</h3>
                        <p className="mt-0.5 text-sm font-semibold text-ink/75">{item.institution}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] ${
                        current ? 'bg-electric text-white' : 'bg-white text-navy/70 border border-navy/10'
                      }`}
                    >
                      {current ? <BookOpen size={11} /> : <CheckCircle2 size={11} />}
                      {item.status ?? 'Completed'}
                    </span>
                  </div>
                  {item.field && <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-electric">{item.field}</p>}
                  {item.description && <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink/75">{item.description}</p>}
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
