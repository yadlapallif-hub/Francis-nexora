import { Briefcase, Trophy, ArrowUpRight, CalendarRange, Building2 } from 'lucide-react';
import { SceneTag } from './SceneTag';
import type { ExperienceItem, Achievement } from '@/lib/types';

export function ExperienceAchievements({ experience, achievements }: { experience: ExperienceItem[]; achievements: Achievement[] }) {
  return (
    <section id="experience" className="bg-white py-24 sm:py-32" aria-label="Experience and achievements">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SceneTag index="06" label="Experience & Achievements" />
        <h2 className="display-tight mt-5 text-4xl font-bold text-navy sm:text-6xl">The ledger<br />of <span className="shimmer-text">proof.</span></h2>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Experience column */}
          <div className="rounded-3xl border border-navy/8 bg-mist p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-skylight"><Briefcase size={19} /></span>
              <h3 className="font-display text-lg font-bold uppercase tracking-[0.16em] text-navy">Experience</h3>
            </div>
            {experience.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-navy/20 bg-white p-7 text-center">
                <p className="font-display text-base font-bold text-navy">Early in the journey — and intentional about it.</p>
                <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-ink/70">
                  Currently a B.Tech CSE student at Raghu Engineering College building real products instead of padding a résumé. Open to internships, open-source collaboration and freelance micro-projects.
                </p>
                <a href="#contact" className="mt-5 inline-flex items-center gap-2 rounded-full bg-electric px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d4fd7]">
                  Work with Francis <ArrowUpRight size={13} />
                </a>
              </div>
            ) : (
              <ol className="mt-6 space-y-4">
                {experience.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-navy/8 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-bold text-navy">{item.role}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/70"><Building2 size={12} />{item.organization}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-electric">
                        <CalendarRange size={11} />{item.start_date ?? ''}{item.current ? ' — Present' : item.end_date ? ` — ${item.end_date}` : ''}
                      </span>
                    </div>
                    {item.description && <p className="mt-3 text-[13px] leading-6 text-ink/75">{item.description}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Achievements column */}
          <div className="rounded-3xl border border-navy/8 bg-mist p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric text-white"><Trophy size={19} /></span>
              <h3 className="font-display text-lg font-bold uppercase tracking-[0.16em] text-navy">Achievements</h3>
            </div>
            {achievements.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-navy/20 bg-white p-7 text-center">
                <p className="font-display text-base font-bold text-navy">Trophies get earned, not decorated.</p>
                <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-ink/70">
                  No inflated badges here. Verified certifications, competitions and milestones will be published in this section as they are earned — editable directly from the FRANCIS studio.
                </p>
                <a href="#work" className="mt-5 inline-flex items-center gap-2 rounded-full border border-navy px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-navy transition hover:bg-navy hover:text-white">
                  See the work instead <ArrowUpRight size={13} />
                </a>
              </div>
            ) : (
              <ol className="mt-6 space-y-4">
                {achievements.map((item) => (
                  <li key={item.id} className="flex items-start gap-4 rounded-2xl border border-navy/8 bg-white p-5">
                    <Trophy size={18} className="mt-1 shrink-0 text-electric" />
                    <div>
                      <p className="font-display font-bold leading-snug text-navy">
                        {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-electric">{item.title}</a> : item.title}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-ink/65">{[item.issuer, item.year].filter(Boolean).join(' · ')}</p>
                      {item.description && <p className="mt-2 text-[13px] leading-6 text-ink/75">{item.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
