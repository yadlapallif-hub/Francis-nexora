import Reveal, { SceneHeading } from '@/components/motion/Reveal';
import { Quote, GraduationCap, Briefcase, Trophy, Sparkles } from 'lucide-react';
import type { AboutSection, Education, Experience, Achievement, Skill, SiteContent } from '@/lib/types';

/* ─── Marquee divider ─────────────────────────────────────────── */
export function Marquee() {
  const phrase = ['THINK.', 'CREATE.', 'BUILD.', 'INNOVATE.'];
  const loop = [...phrase, ...phrase, ...phrase];
  return (
    <div className="overflow-hidden border-y border-navy bg-navy py-3" aria-hidden="true">
      <div className="marquee-track whitespace-nowrap">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {[...loop, ...loop].map((word, i) => (
              <span key={`${half}-${i}`} className="mx-6 flex items-center gap-6 font-display text-xl font-bold tracking-[0.14em] text-white sm:text-2xl">
                {word} <span className="text-electric">●</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SCENE 03 · About ────────────────────────────────────────── */
export function AboutScene({ about, profile }: { about: AboutSection[]; profile: SiteContent['profile'] }) {
  return (
    <section id="about" className="relative bg-soft py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SceneHeading scene="03" kicker="About" title={<>The mind behind <span className="text-electric">FRANCIS</span>.</>} />
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {about.map((section, i) => (
              <Reveal key={`${section.title}-${i}`} delay={i * 0.08}>
                <div className="group flex gap-5 rounded-3xl border border-navy/5 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card sm:p-7">
                  <span className="text-display text-3xl font-bold text-navy/10 transition-colors group-hover:text-electric/40">0{i + 1}</span>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-electric">{section.pillar ?? 'Profile'}</p>
                    <h3 className="text-display mt-1.5 text-xl font-bold text-navy">{section.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink/80">{section.content}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.15} className="flex h-full flex-col justify-between gap-8 rounded-3xl bg-navy p-8 text-white shadow-card sm:p-10">
              <Quote size={40} className="text-electric" strokeWidth={1.5} />
              <div>
                <p className="text-display text-3xl font-bold leading-[1.05] sm:text-4xl">
                  Think.<br />Create.<br />Build.<br /><span className="text-electric">Innovate.</span>
                </p>
                <p className="mt-6 text-sm leading-relaxed text-blue-100/75">{profile.intro}</p>
              </div>
              <ul className="space-y-2.5 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-blue-200/80">
                <li className="flex justify-between gap-4"><span className="text-blue-300/60">Name</span><span className="text-right text-white">{profile.full_name}</span></li>
                <li className="flex justify-between gap-4"><span className="text-blue-300/60">Role</span><span className="text-right text-white">{profile.title}</span></li>
                <li className="flex justify-between gap-4"><span className="text-blue-300/60">Based in</span><span className="text-right text-white">Visakhapatnam, India</span></li>
                <li className="flex justify-between gap-4"><span className="text-blue-300/60">Studying</span><span className="text-right text-white">B.Tech CSE — Raghu Engineering College</span></li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SCENE 04 · Skills ───────────────────────────────────────── */
export function SkillsScene({ skills }: { skills: Skill[] }) {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
  }
  return (
    <section id="skills" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SceneHeading scene="04" kicker="Technical skills" title={<>Tools of the <span className="text-electric">craft</span>.</>} />
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
          {[...groups.entries()].map(([category, list], groupIndex) => (
            <div key={category}>
              <p className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-navy/60">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mist font-display text-[10px] font-bold text-electric">{groupIndex + 1}</span>
                {category}
              </p>
              <ul className="space-y-3.5">
                {list.map((skill) => (
                  <li key={skill.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-4">
                      <span className="font-display text-sm font-semibold text-navy">{skill.name}</span>
                      <span className="font-mono text-[10px] text-ink/45">{skill.level}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={skill.level} aria-valuemin={0} aria-valuemax={100} aria-label={`${skill.name} proficiency`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-electric/70 to-electric transition-[width] duration-1000 ease-out" style={{ width: `${skill.level}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/35">Self-assessed · every value editable from the Admin Studio</p>
      </div>
    </section>
  );
}

/* ─── SCENE 05 · Education (dark) ─────────────────────────────── */
export function EducationScene({ education }: { education: Education[] }) {
  return (
    <section id="education" className="noise relative overflow-hidden bg-navy py-24 text-white">
      <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-electric/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-electric/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SceneHeading light scene="05" kicker="Education" title={<>Built in the <span className="text-electric">classroom</span>, sharpened by building.</>} />
        <ol className="relative ml-2 space-y-10 border-l border-blue-300/20 pl-10 sm:ml-6">
          {education.map((entry, i) => (
            <li key={`${entry.degree}-${i}`} className="relative">
              <span className="absolute -left-[52px] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-electric/60 bg-navy sm:-left-[68px]">
                <GraduationCap size={12} className="text-electric" />
              </span>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:border-electric/40 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-display text-2xl font-bold">{entry.degree}<span className="text-electric"> · </span>{entry.field}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.28em] text-blue-200/80">{entry.institution}</p>
                  </div>
                  <span className={`rounded-full border px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.3em] ${entry.status === 'Pursuing' ? 'border-emerald-400/40 text-emerald-300' : 'border-blue-300/30 text-blue-200/80'}`}>
                    {entry.status ?? 'Completed'}
                  </span>
                </div>
                {entry.description ? <p className="mt-4 max-w-3xl text-sm leading-relaxed text-blue-100/75">{entry.description}</p> : null}
                {entry.start_year || entry.end_year ? (
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-blue-300/60">{entry.start_year ?? '—'} → {entry.end_year ?? 'Present'}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── SCENE 07 · Experience + Achievements ────────────────────── */
export function ExperienceScene({ experience, achievements }: { experience: Experience[]; achievements: Achievement[] }) {
  return (
    <section id="experience" className="bg-soft py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SceneHeading scene="07" kicker="Experience & achievements" title={<>Every expert was once a <span className="text-electric">beginner</span>.</>} />
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-navy/60"><Briefcase size={14} className="text-electric" /> Experience</p>
            {experience.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-navy/15 bg-white/60 p-8">
                <p className="text-display text-lg font-bold text-navy">Currently engineering the foundation.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">Francis is a B.Tech CSE student focused on building real products — like NEXORA AGENT. Internships, collaborations and open-source contributions will appear here as they happen.</p>
                <a href="mailto:yadlapallif@gmail.com" className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-electric transition hover:text-navy">Offer an opportunity →</a>
              </div>
            ) : (
              <ul className="space-y-4">
                {experience.map((exp, i) => (
                  <li key={`${exp.role}-${i}`} className="rounded-3xl border border-navy/5 bg-white p-6 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-display text-lg font-bold text-navy">{exp.role} <span className="text-electric">@ {exp.organization}</span></h3>
                      <span className="rounded-full bg-mist px-3 py-1 font-mono text-[9px] uppercase tracking-[0.3em] text-electric">{exp.type}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">{exp.start_date ?? ''}{exp.start_date ? ' → ' : ''}{exp.current ? 'Present' : exp.end_date ?? ''}</p>
                    {exp.description ? <p className="mt-3 text-sm leading-relaxed text-ink/75">{exp.description}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-navy/60"><Trophy size={14} className="text-electric" /> Achievements</p>
            {achievements.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-navy/15 bg-white/60 p-8">
                <p className="text-display text-lg font-bold text-navy">Building, not collecting badges — yet.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">No achievements are published yet. Hackathons, certifications and competition results Francis earns will be recorded here from the Admin Studio.</p>
                <p className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-electric"><Sparkles size={13} /> In progress</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {achievements.map((item, i) => (
                  <li key={`${item.title}-${i}`} className="rounded-3xl border border-navy/5 bg-white p-6 shadow-soft">
                    <h3 className="text-display text-lg font-bold text-navy">{item.url ? <a className="transition hover:text-electric" href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">{[item.issuer, item.year].filter(Boolean).join(' · ')}</p>
                    {item.description ? <p className="mt-3 text-sm leading-relaxed text-ink/75">{item.description}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
