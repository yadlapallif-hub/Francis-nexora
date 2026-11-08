'use client';

import { motion } from 'framer-motion';
import { SceneTag } from './SceneTag';
import type { Skill } from '@/lib/types';

const CATEGORY_ORDER = ['Programming Languages', 'Web Development', 'Tools & Platforms', 'Domains'];

export function Skills({ skills }: { skills: Skill[] }) {
  const categories = CATEGORY_ORDER.map((cat) => ({ name: cat, items: skills.filter((s) => s.category === cat) }))
    .concat(
      Array.from(new Set(skills.map((s) => s.category)))
        .filter((c) => !CATEGORY_ORDER.includes(c))
        .map((cat) => ({ name: cat, items: skills.filter((s) => s.category === cat) }))
    )
    .filter((g) => g.items.length > 0);

  return (
    <section id="skills" className="relative overflow-hidden bg-mist py-24 sm:py-32" aria-label="Technical skills">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(245,245,244,0.95),transparent_65%)]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SceneTag index="03" label="Technical Skills" />
            <h2 className="display-tight mt-5 text-4xl font-bold text-navy sm:text-6xl">
              Tools of<br />the <span className="shimmer-text">craft.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-ink/65">
            A living stack, sharpened daily. Every bar below is editable from the FRANCIS control studio — nothing here is decorative filler.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {categories.map((group, gi) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, x: gi % 2 === 0 ? -72 : 72, y: 16 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: gi * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="card-outline rounded-3xl border border-navy/8 bg-white p-6 sm:p-7"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold uppercase tracking-[0.14em] text-navy">{group.name}</h3>
                <span className="font-mono text-[10px] text-electric">{String(group.items.length).padStart(2, '0')}</span>
              </div>
              <div className="mt-5 space-y-4">
                {group.items.map((skill, i) => (
                  <div key={skill.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-ink/85">{skill.name}</span>
                      <span className="font-mono text-[10px] text-ink/45">{skill.level}</span>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-skylight" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.level} aria-label={`${skill.name} proficiency`}>
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-electric via-[#ef4444] to-[#ff8a7a]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 1.15, delay: 0.05 * i + gi * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
