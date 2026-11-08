import { ArrowUpRight, Check, ExternalLink, FolderKanban } from 'lucide-react';
import { GitHubIcon as Github } from '@/components/brand-icons';
import Reveal, { SceneHeading } from '@/components/motion/Reveal';
import type { Project } from '@/lib/types';

export default function Projects({ projects }: { projects: Project[] }) {
  const featured = projects.find((p) => p.featured) ?? projects[0] ?? null;
  const rest = projects.filter((p) => p !== featured);

  return (
    <section id="work" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SceneHeading
          scene="06"
          kicker="Featured projects"
          title={<>Shipped. Not just <span className="text-electric">saved</span>.</>}
        />

        {featured ? (
          <Reveal>
            <article className="group grid overflow-hidden rounded-[2rem] border border-navy/8 bg-navy text-white shadow-card lg:grid-cols-2">
              <div className="relative min-h-[280px] overflow-hidden sm:min-h-[380px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.image_url ?? '/images/nexora-visual.jpg'}
                  alt={`${featured.title} product visual`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-navy/10 via-navy/10 to-navy" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent" />
                <span className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" /> Live in production
                </span>
              </div>
              <div className="relative flex flex-col justify-center gap-5 p-7 sm:p-10">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blue-300/80">Featured · 01</p>
                  <h3 className="text-display mt-2 text-4xl font-bold sm:text-5xl">{featured.title}</h3>
                  <p className="mt-2 text-blue-100/85">{featured.tagline}</p>
                </div>
                <p className="text-sm leading-relaxed text-blue-100/70">{featured.description}</p>
                <ul className="grid gap-2 sm:grid-cols-1">
                  {featured.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-blue-100/85">
                      <Check size={15} className="mt-0.5 shrink-0 text-electric" strokeWidth={3} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <ul className="flex flex-wrap gap-2" aria-label="Technologies">
                  {featured.technologies.map((tech) => (
                    <li key={tech} className="rounded-full border border-blue-300/20 bg-blue-400/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-200/85">{tech}</li>
                  ))}
                </ul>
                <div className="mt-1 flex flex-wrap gap-3">
                  {featured.live_url ? (
                    <a href={featured.live_url} target="_blank" rel="noreferrer" className="btn-shine flex items-center gap-2 rounded-full bg-electric px-6 py-3 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-blue-500">
                      View live <ArrowUpRight size={14} />
                    </a>
                  ) : null}
                  {featured.github_url ? (
                    <a href={featured.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100 transition hover:border-blue-300/50 hover:text-white">
                      <Github size={14} /> Source
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          </Reveal>
        ) : null}

        {rest.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((project) => (
              <article key={project.slug} className="group flex flex-col overflow-hidden rounded-3xl border border-navy/8 bg-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card">
                {project.image_url ? (
                  <div className="relative h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={project.image_url} alt={project.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-navy/90"><FolderKanban size={40} className="text-electric" /></div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="text-display text-xl font-bold text-navy">{project.title}</h3>
                  <p className="text-sm leading-relaxed text-ink/75">{project.tagline ?? project.description?.slice(0, 140)}</p>
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    {project.live_url ? (
                      <a href={project.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-electric transition hover:text-navy">Live <ExternalLink size={12} /></a>
                    ) : null}
                    {project.github_url ? (
                      <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-navy/60 transition hover:text-navy"><Github size={12} /> GitHub</a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <p className="mt-10 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/35">More projects are being engineered — new work appears here after publishing from the Admin Studio.</p>
      </div>
    </section>
  );
}
