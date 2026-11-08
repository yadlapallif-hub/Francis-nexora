import Link from 'next/link';
import { Mail, MessageCircle, ArrowUpRight } from 'lucide-react';
import { GitHubIcon, InstagramIcon, LinkedInIcon } from '@/components/icons/BrandIcons';
import { LogoMark } from '@/components/brand/LogoMark';
import type { SocialLink } from '@/lib/types';

import type { ComponentType } from 'react';

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  email: Mail,
  github: GitHubIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  whatsapp: MessageCircle,
};

export function Footer({ socials, email }: { socials: SocialLink[]; email?: string | null }) {
  const visible = socials.filter((s) => s.visible && s.url);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy text-skylight">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(14,138,156,0.28),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-10 border-b border-skylight/10 pb-10 md:flex-row md:items-center">
          <div>
            <Link href="/" aria-label="FRANCIS home" className="flex items-center gap-3">
              <LogoMark className="h-10 w-10" mono={false} />
              <span className="font-display text-2xl font-bold tracking-[0.1em] text-white">
                FRANCIS<span className="text-electric">.</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-skylight/65">
              THINK. CREATE. BUILD. INNOVATE. — A cinematic developer portfolio, a general-purpose AI
              assistant, and a living project showcase.
            </p>
          </div>
          <Link
            href="/ai"
            className="group flex items-center gap-2 rounded-2xl border border-skylight/15 bg-white/5 px-6 py-4 font-display text-sm font-bold uppercase tracking-[0.2em] text-skylight transition hover:border-electric hover:text-white"
          >
            Talk to FRANCIS AI
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-skylight/55">
            © {year} Yadlapalli Francis. Built with intention in Visakhapatnam, India.
          </p>
          <div className="flex items-center gap-2">
            {visible.map((social) => {
              const Icon = ICONS[social.platform] ?? Mail;
              const href = social.platform === 'email' && !social.url.startsWith('mailto:') ? `mailto:${email ?? ''}` : social.url;
              return (
                <a
                  key={social.id}
                  href={href}
                  target={social.platform === 'email' ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={social.label ?? social.platform}
                  title={social.label ?? social.platform}
                  className="rounded-full border border-skylight/15 p-3 text-skylight/75 transition hover:border-electric hover:bg-electric/10 hover:text-white"
                >
                  <Icon size={17} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
