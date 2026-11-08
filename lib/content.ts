import 'server-only';
import { cache } from 'react';
import { getPublicSupabase } from '@/lib/supabase/public';
import { FALLBACK_DATA } from '@/lib/fallback';
import type {
  PortfolioData,
  ThemeSettings,
  HomepageSettings,
  SeoSettings,
  DraftEnvelope,
} from '@/lib/types';

/** Unwrap { live, draft } envelopes stored in website_settings. */
function unwrap<T>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && 'live' in (value as Record<string, unknown>)) {
    const live = (value as DraftEnvelope<T>).live;
    if (live && typeof live === 'object') return { ...fallback, ...live };
  }
  return fallback;
}

export const getPortfolioData = cache(async (): Promise<PortfolioData> => {
  const sb = getPublicSupabase();
  if (!sb) return FALLBACK_DATA;

  try {
    const [
      profileRes,
      aboutRes,
      skillsRes,
      educationRes,
      projectsRes,
      experienceRes,
      achievementsRes,
      galleryRes,
      socialsRes,
      settingsRes,
    ] = await Promise.all([
      sb.from('profiles').select('*').eq('id', 'francis').maybeSingle(),
      sb.from('about_sections').select('*').eq('visible', true).order('display_order'),
      sb.from('skills').select('*').eq('visible', true).order('display_order'),
      sb.from('education').select('*').eq('visible', true).order('display_order'),
      sb.from('projects').select('*').eq('visible', true).order('display_order'),
      sb.from('experience').select('*').eq('visible', true).order('display_order'),
      sb.from('achievements').select('*').eq('visible', true).order('display_order'),
      sb.from('gallery').select('*').eq('visible', true).order('display_order'),
      sb.from('social_links').select('*').eq('visible', true).order('display_order'),
      sb.from('website_settings').select('key, value'),
    ]);

    const profile = profileRes.data
      ? { ...FALLBACK_DATA.profile, ...profileRes.data }
      : FALLBACK_DATA.profile;

    const settingsMap = new Map<string, unknown>();
    for (const row of settingsRes.data ?? []) settingsMap.set(row.key, row.value);

    const theme = unwrap<ThemeSettings>(settingsMap.get('theme'), FALLBACK_DATA.settings.theme);
    const homepage = unwrap<HomepageSettings>(
      settingsMap.get('homepage'),
      FALLBACK_DATA.settings.homepage
    );
    const seo = unwrap<SeoSettings>(settingsMap.get('seo'), FALLBACK_DATA.settings.seo);

    return {
      source: 'supabase',
      profile,
      about: aboutRes.data?.length ? aboutRes.data : FALLBACK_DATA.about,
      skills: skillsRes.data?.length ? skillsRes.data : FALLBACK_DATA.skills,
      education: educationRes.data?.length ? educationRes.data : FALLBACK_DATA.education,
      projects: projectsRes.data ?? [],
      experience: experienceRes.data ?? [],
      achievements: achievementsRes.data ?? [],
      gallery: galleryRes.data ?? [],
      socials: socialsRes.data?.length ? socialsRes.data : FALLBACK_DATA.socials,
      settings: { theme, homepage, seo },
    };
  } catch (error) {
    console.error('[portfolio] Supabase fetch failed, using fallback content:', error);
    return FALLBACK_DATA;
  }
});
