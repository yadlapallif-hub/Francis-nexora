import Link from 'next/link';
import { getSiteContent } from '@/lib/content';
import NavBar from '@/components/portfolio/NavBar';
import Hero from '@/components/portfolio/Hero';
import Projects from '@/components/portfolio/Projects';
import Contact from '@/components/portfolio/Contact';
import Footer from '@/components/portfolio/Footer';
import { Marquee, AboutScene, SkillsScene, EducationScene, ExperienceScene } from '@/components/portfolio/sections';
import { LogoMark } from '@/components/brand';
import { Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const content = await getSiteContent();

  if (content.maintenance.enabled) {
    return (
      <main className="hero-scene flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
        <LogoMark size={72} />
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.5em] text-blue-300/80">Scheduled transmission</p>
        <h1 className="text-display mt-4 text-4xl font-bold sm:text-6xl">FRANCIS is recalibrating.</h1>
        <p className="mt-4 max-w-md text-blue-100/85">{content.maintenance.message}</p>
      </main>
    );
  }

  const scenes = content.homepage.scenes ?? {};
  const show = (key: string) => scenes[key] !== false;

  return (
    <main className="bg-white">
      <NavBar resumeUrl={content.profile.resume_url} />
      <Hero homepage={content.homepage} profile={content.profile} />
      <Marquee />
      {show('about') && <AboutScene about={content.about} profile={content.profile} />}
      {show('skills') && <SkillsScene skills={content.skills} />}
      {show('education') && <EducationScene education={content.education} />}
      {show('projects') && <Projects projects={content.projects} />}
      {show('experience') && <ExperienceScene experience={content.experience} achievements={content.achievements} />}
      {show('contact') && <Contact content={content} />}
      <Footer content={content} />

      {/* Ask dock — Scene ∞ */}
      <Link
        href="/ai"
        aria-label="Open FRANCIS AI"
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-blue-200/60 bg-navy/90 py-3 pl-4 pr-5 text-white shadow-glow backdrop-blur transition hover:bg-navy sm:bottom-7 sm:right-7"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-electric" />
        </span>
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 transition group-hover:text-white">Ask FRANCIS AI</span>
        <Sparkles size={15} className="text-blue-300 transition group-hover:rotate-12" />
      </Link>
    </main>
  );
}
