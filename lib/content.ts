import 'server-only';
import { createServiceClient, hasServiceRole } from './supabase/admin';
import { FALLBACK_CONTENT } from './fallback';
import type {
  Achievement,
  AboutSection,
  Draftable,
  Education,
  Experience,
  GalleryItem,
  HeroHomepage,
  SeoSettings,
  SiteContent,
  Skill,
  SocialLink,
  ThemeSettings,
  Project,
  Profile,
} from './types';

function unwrap<T>(raw: unknown, fallback: T): T {
  const v = (raw ?? {}) as Partial<Draftable<T>> & Partial<T>;
  if (v && typeof v === 'object' && 'live' in v && v.live) return v.live as T;
  return fallback;
}

function order<T extends { display_order?: number }>(rows: T[] | null): T[] {
  return [...(rows ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

const visible = <T extends { visible?: boolean }>(rows: T[]): T[] => rows.filter((r) => r.visible !== false);

/** Fetch all public content. Never throws — falls back to bundled defaults. */
export async function getSiteContent(): Promise<SiteContent> {
  if (!hasServiceRole() && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return FALLBACK_CONTENT;
  }
  try {
    // Public reads: use the service client (missing key → error → fallback).
    const supabase = createServiceClient();
    const [profiles, about, skills, education, projects, experience, achievements, gallery, socials, settings, ai] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', 'francis').maybeSingle(),
        supabase.from('about_sections').select('*').order('display_order'),
        supabase.from('skills').select('*').order('display_order'),
        supabase.from('education').select('*').order('display_order'),
        supabase.from('projects').select('*').order('display_order'),
        supabase.from('experience').select('*').order('display_order'),
        supabase.from('achievements').select('*').order('display_order'),
        supabase.from('gallery').select('*').order('display_order'),
        supabase.from('social_links').select('*').order('display_order'),
        supabase.from('website_settings').select('key, value'),
        supabase.from('ai_settings').select('enabled, welcome_message, allowed_uploads').eq('id', 1).maybeSingle(),
      ]);

    const settingsMap = new Map<string, unknown>();
    for (const row of settings.data ?? []) {
      settingsMap.set((row as { key: string }).key, (row as { value: unknown }).value);
    }

    const homepage = unwrap<HeroHomepage>(settingsMap.get('homepage'), FALLBACK_CONTENT.homepage);
    const seo = unwrap<SeoSettings>(settingsMap.get('seo'), FALLBACK_CONTENT.seo);
    const theme = unwrap<ThemeSettings>(settingsMap.get('theme'), FALLBACK_CONTENT.theme);
    const maintenance = unwrap<typeof FALLBACK_CONTENT.maintenance>(
      settingsMap.get('maintenance'),
      FALLBACK_CONTENT.maintenance,
    );

    return {
      source: 'live',
      profile: (profiles.data as Profile | null) ?? FALLBACK_CONTENT.profile,
      about: visible(order(about.data as AboutSection[] | null)) ?? FALLBACK_CONTENT.about,
      skills: visible(order(skills.data as Skill[] | null)),
      education: visible(order(education.data as Education[] | null)),
      projects: visible(order(projects.data as Project[] | null)),
      experience: visible(order(experience.data as Experience[] | null)),
      achievements: visible(order(achievements.data as Achievement[] | null)),
      gallery: visible(order(gallery.data as GalleryItem[] | null)),
      socials: visible(order(socials.data as SocialLink[] | null)),
      homepage,
      seo,
      theme,
      maintenance: {
        enabled: Boolean(maintenance.enabled),
        message: maintenance.message || FALLBACK_CONTENT.maintenance.message,
      },
      ai: {
        enabled: ai.data?.enabled ?? true,
        welcomeMessage: ai.data?.welcome_message || FALLBACK_CONTENT.ai.welcomeMessage,
        allowedUploads: (ai.data?.allowed_uploads as string[] | null) ?? ['pdf', 'txt', 'docx'],
      },
    };
  } catch (error) {
    console.error('[content] Supabase unavailable, using bundled fallback:', error);
    return FALLBACK_CONTENT;
  }
}

/** Compact FRANCIS context injected into portfolio-mode prompts (and retrieval). */
export function buildFrancisContext(content: SiteContent): string {
  const p = content.profile;
  const lines: string[] = [
    'APPROVED KNOWLEDGE ABOUT FRANCIS (use this for personal questions; do not invent beyond it):',
    `- Name: ${p.full_name} (display: ${p.display_name})`,
    `- Title: ${p.title}`,
    `- Education: ${p.education} at ${p.college}`,
    `- Previous education: ${p.previous_education}`,
    `- Location: ${p.location}`,
    `- Email: ${p.email}`,
    `- Instagram: ${p.instagram_url}`,
    `- GitHub: ${p.github_url || 'not published yet'}`,
    `- LinkedIn: ${p.linkedin_url || 'not published yet'}`,
    `- Intro: ${p.intro}`,
    `- Tagline: ${p.tagline}`,
    '',
    'PROJECTS:',
  ];
  for (const proj of content.projects) {
    lines.push(
      `- ${proj.title}: ${proj.tagline ?? ''} ${proj.description ?? ''} Tech: ${proj.technologies.join(', ')}. Live: ${proj.live_url ?? 'n/a'}`,
    );
  }
  lines.push('', 'EDUCATION:');
  for (const ed of content.education) {
    lines.push(`- ${ed.degree} — ${ed.institution} (${ed.field ?? ''}) · ${ed.status ?? ''}`);
  }
  lines.push('', 'SKILLS (self-rated, editable):', content.skills.map((s) => s.name).join(', '));
  return lines.join('\n');
}
