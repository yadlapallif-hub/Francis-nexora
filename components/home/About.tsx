'use client';

import { motion } from 'framer-motion';
import { GraduationCap, MapPin, Quote, FileText } from 'lucide-react';
import { SceneTag } from './SceneTag';
import type { AboutSection, Profile } from '@/lib/types';

export function About({ sections, profile }: { sections: AboutSection[]; profile: Profile }) {
  return (
    <section id="about" className="relative overflow-hidden bg-white py-24 sm:py-32" aria-label="About Francis">
      <div className="pointer-events-none absolute -left-40 top-24 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(245,245,244,0.9),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-20">
        {/* Portrait plate */}
        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, x: -84, rotate: -3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-sm"
          >
            <div className="absolute -inset-3 -rotate-2 rounded-[28px] border border-electric/20 bg-skylight" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-3xl border border-navy/10 shadow-card">
              <img
                src={profile.avatar_url || '/images/francis-portrait.jpg'}
                alt={`Portrait of ${profile.full_name}`}
                width={560}
                height={700}
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent p-5 pt-16">
                <p className="font-display text-lg font-bold text-white">{profile.full_name}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-skylight/80">{profile.title}</p>
              </div>
            </div>
            <div className="absolute -right-4 top-8 rotate-3 rounded-2xl bg-navy px-4 py-2.5 shadow-glowsm">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-skylight/70">Diploma</p>
              <p className="text-xs font-bold text-white">Computer Engineering</p>
            </div>
          </motion.div>
        </div>

        {/* Narrative */}
        <div className="lg:col-span-8">
          <SceneTag index="02" label="About — Who Francis is" />
          <h2 className="display-tight mt-5 text-4xl font-bold text-navy sm:text-6xl">
            Engineer by study.<br />
            <span className="text-outline" style={{ WebkitTextStrokeColor: '#0A0A0C' }}>Builder by instinct.</span>
          </h2>
          <p className="mt-6 flex items-start gap-3 text-[15px] leading-7 text-ink/80 sm:text-base">
            <Quote size={16} className="mt-1 shrink-0 text-electric" />
            {profile.intro}
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {sections.map((section, i) => (
              <motion.article
                key={section.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -56 : 56, y: 12 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="card-outline group rounded-2xl border border-navy/8 bg-mist p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-electric/40 hover:shadow-glowsm"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-electric">{section.pillar ?? 'Profile'}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-navy group-hover:text-electric transition-colors">{section.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-ink/75">{section.content}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-ink/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2"><GraduationCap size={15} className="text-electric" /> B.Tech CSE — Raghu Engineering College</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2"><MapPin size={15} className="text-electric" /> {profile.location}</span>
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 font-semibold text-white transition hover:bg-electric">
                <FileText size={15} /> Download résumé
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
