export type Profile = {
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
};

export type AboutSection = {
  id?: string;
  title: string;
  pillar: string | null;
  content: string;
  display_order: number;
  visible: boolean;
};

export type Skill = {
  id?: string;
  name: string;
  category: string;
  level: number;
  display_order: number;
  visible: boolean;
};

export type Education = {
  id?: string;
  degree: string;
  institution: string;
  field: string | null;
  start_year: string | null;
  end_year: string | null;
  status: string | null;
  description: string | null;
  display_order: number;
  visible: boolean;
};

export type Project = {
  id?: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  technologies: string[];
  features: string[];
  live_url: string | null;
  github_url: string | null;
  image_url: string | null;
  featured: boolean;
  display_order: number;
  visible: boolean;
};

export type Experience = {
  id?: string;
  role: string;
  organization: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  current: boolean;
  description: string | null;
  display_order: number;
  visible: boolean;
};

export type Achievement = {
  id?: string;
  title: string;
  issuer: string | null;
  year: string | null;
  description: string | null;
  url: string | null;
  display_order: number;
  visible: boolean;
};

export type SocialLink = {
  id?: string;
  platform: string;
  label: string | null;
  url: string;
  display_order: number;
  visible: boolean;
};

export type GalleryItem = {
  id?: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  visible: boolean;
};

export type HeroHomepage = {
  heroEyebrow: string;
  headline: string[];
  subline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scenes: Record<string, boolean>;
};

export type SeoSettings = {
  title: string;
  description: string;
  keywords: string;
};

export type ThemeSettings = {
  accent: string;
  mode: 'light';
};

export type Draftable<T> = { live: T; draft: T | null };

export type AiSettings = {
  id: number;
  enabled: boolean;
  provider: string;
  model: string;
  web_search: boolean;
  max_response_tokens: number;
  hourly_limit: number;
  allowed_uploads: string[];
  personality: string;
  welcome_message: string;
  allow_admin_content_view: boolean;
};

export type SiteContent = {
  profile: Profile;
  about: AboutSection[];
  skills: Skill[];
  education: Education[];
  projects: Project[];
  experience: Experience[];
  achievements: Achievement[];
  gallery: GalleryItem[];
  socials: SocialLink[];
  homepage: HeroHomepage;
  seo: SeoSettings;
  theme: ThemeSettings;
  maintenance: { enabled: boolean; message: string };
  ai: { enabled: boolean; welcomeMessage: string; allowedUploads: string[] };
  source: 'live' | 'fallback';
};
