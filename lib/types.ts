export interface Profile {
  id: string;
  full_name: string;
  display_name: string;
  title: string;
  education: string | null;
  college: string | null;
  location: string | null;
  previous_education: string | null;
  email: string | null;
  instagram_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  resume_url: string | null;
  tagline: string | null;
  intro: string | null;
  avatar_url: string | null;
}

export interface AboutSection { id: string; title: string; pillar: string | null; content: string; display_order: number; visible: boolean }
export interface Skill { id: string; name: string; category: string; level: number; display_order: number; visible: boolean }
export interface EducationItem { id: string; degree: string; institution: string; field: string | null; start_year: string | null; end_year: string | null; status: string | null; description: string | null; display_order: number; visible: boolean }
export interface Project { id: string; title: string; slug: string; tagline: string | null; description: string | null; technologies: string[]; features: string[]; live_url: string | null; github_url: string | null; image_url: string | null; featured: boolean; display_order: number; visible: boolean }
export interface ExperienceItem { id: string; role: string; organization: string; type: string; start_date: string | null; end_date: string | null; current: boolean; description: string | null; display_order: number; visible: boolean }
export interface Achievement { id: string; title: string; issuer: string | null; year: string | null; description: string | null; url: string | null; display_order: number; visible: boolean }
export interface GalleryItem { id: string; image_url: string; caption: string | null; display_order: number; visible: boolean }
export interface SocialLink { id: string; platform: string; label: string | null; url: string; display_order: number; visible: boolean }

export interface ThemeSettings { accent: string; mode: 'light' | 'dark' }
export interface HomepageSettings {
  heroEyebrow: string;
  headline: string[];
  subline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scenes: Record<'about' | 'skills' | 'education' | 'projects' | 'experience' | 'contact', boolean>;
}
export interface SeoSettings { title: string; description: string; keywords: string }
export interface DraftEnvelope<T> { live: T; draft: T | null }

export interface PortfolioData {
  profile: Profile;
  about: AboutSection[];
  skills: Skill[];
  education: EducationItem[];
  projects: Project[];
  experience: ExperienceItem[];
  achievements: Achievement[];
  gallery: GalleryItem[];
  socials: SocialLink[];
  settings: {
    theme: ThemeSettings;
    homepage: HomepageSettings;
    seo: SeoSettings;
  };
  source: 'supabase' | 'fallback';
}

export type ChatMode = 'general' | 'portfolio' | 'research' | 'programming';

export interface SearchSource { title: string; url: string; snippet: string }
