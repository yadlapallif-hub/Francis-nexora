'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Check, ExternalLink, Sparkles } from 'lucide-react';
import { SceneTag } from './SceneTag';
import type { Project } from '@/lib/types';

export function Projects({ projects }: { projects: Project[] }) {
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const rest = projects.filter((p) => p.id !== featured?.id);

  return (
    <section id="work" className="relative overflow-hidden bg-navy py-24 text-skylight sm:py-32" aria-label="Featured projects">
      <img src="/images/hero-backdrop.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy via-navy/60 to-navy" />
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-20" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SceneTag index="05" label="Featured Projects" dark />
            <h2 className="display-tight mt-5 text-4xl font-bold text-white sm:text-6xl">
              Work that <span className="text-electric">ships.</span>
            </h2>
          </div>
          <a href="https://github.com/yadlapallif-hub?tab=repositories" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-skylight/60 transition hover:text-white">
            All repositories <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 56 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dark mt-14 grid overflow-hidden rounded-[28px] lg:grid-cols-12"
          >
            {/* Visual plate */}
            <div className="relative min-h-[280px] overflow-hidden lg:col-span-6">
              <img
                src={featured.image_url || '/images/nexora-visual.jpg'}
                alt={`${featured.title} — product visual`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-navy/10 to-[#0d264c]/90" />
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-electric/50 bg-navy/70 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-electric backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-electric" /> Featured
              </span>
            </div>

            {/* Copy */}
            <div className="flex flex-col justify-center gap-5 p-6 sm:p-9 lg:col-span-6">
              <h3 className="display-tight text-4xl font-bold text-white sm:text-5xl">{featured.title}</h3>
              {featured.tagline && <p className="text-[15px] font-semibold leading-6 text-electric">{featured.tagline}</p>}
              {featured.description && <p className="text-[14px] leading-7 text-skylight/80">{featured.description}</p>}

              {featured.features.length > 0 && (
                <ul className="grid gap-2 text-[13px] text-skylight/85 sm:grid-cols-2">
                  {featured.features.slice(0, 6).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-electric" strokeWidth={3} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {featured.technologies.map((tech) => (
                  <span key={tech} className="rounded-md border border-skylight/15 bg-white/5 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-skylight/75">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {featured.live_url && (
                  <a href={featured.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-electric px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-glowsm transition hover:bg-[#1d4fd7]">
                    Visit live <ExternalLink size={14} strokeWidth={2.5} />
                  </a>
                )}
                {featured.github_url && (
                  <a href={featured.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-skylight/25 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-skylight transition hover:border-skylight/60 hover:text-white">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        )}

        {rest.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((project) => (
              <article key={project.id} className="group overflow-hidden rounded-2xl border border-skylight/12 bg-white/[0.04] backdrop-blur transition hover:border-electric/45">
                {project.image_url && (
                  <div className="h-44 overflow-hidden">
                    <img src={project.image_url} alt={project.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-white">{project.title}</h3>
                  {project.tagline && <p className="mt-1 text-[12px] leading-5 text-skylight/65">{project.tagline}</p>}
                  <div className="mt-4 flex gap-3">
                    {project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer" className="text-[11px] font-bold uppercase tracking-[0.2em] text-electric hover:text-white">Live ↗</a>}
                    {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="text-[11px] font-bold uppercase tracking-[0.2em] text-skylight/60 hover:text-white">GitHub ↗</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-10 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-skylight/40">
          <Sparkles size={11} /> More projects in the studio pipeline — ask FRANCIS AI
        </p>
      </div>
    </section>
  );
}
