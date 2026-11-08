import { getPortfolioData } from '@/lib/content';
import { Nav } from '@/components/layout/Nav';
import { SceneDots } from '@/components/layout/SceneDots';
import { Footer } from '@/components/layout/Footer';
import { Loader } from '@/components/home/Loader';
import { Hero } from '@/components/home/Hero';
import { About } from '@/components/home/About';
import { Skills } from '@/components/home/Skills';
import { Education } from '@/components/home/Education';
import { Projects } from '@/components/home/Projects';
import { ExperienceAchievements } from '@/components/home/ExperienceAchievements';
import { Contact } from '@/components/home/Contact';
import { Closing } from '@/components/home/Closing';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getPortfolioData();
  const { homepage } = data.settings;
  const scenes = homepage.scenes;
  const nexora = data.projects.find((p) => p.slug === 'nexora-agent');

  return (
    <main id="francis-root" className="bg-white">
      <Loader />
      <Nav resumeUrl={data.profile.resume_url} />
      <SceneDots />

      {/* SCENE 02 — Cinematic hero */}
      <Hero homepage={homepage} profile={data.profile} nexoraLiveUrl={nexora?.live_url} />

      {/* SCENE 03 — About */}
      {scenes.about !== false && <About sections={data.about} profile={data.profile} />}

      {/* SCENE 04 — Technical skills */}
      {scenes.skills !== false && <Skills skills={data.skills} />}

      {/* SCENE 05 — Education */}
      {scenes.education !== false && <Education education={data.education} />}

      {/* SCENE 06 — Featured projects */}
      {scenes.projects !== false && <Projects projects={data.projects} />}

      {/* SCENE 07 — Experience & achievements */}
      {scenes.experience !== false && (
        <ExperienceAchievements experience={data.experience} achievements={data.achievements} />
      )}

      {/* SCENE 08 — Contact */}
      {scenes.contact !== false && <Contact profile={data.profile} socials={data.socials} />}

      {/* SCENE 09 — Final brand frame */}
      <Closing />

      <Footer socials={data.socials} email={data.profile.email} />
    </main>
  );
}
