import Link from 'next/link';
import { Mail, MessageCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { GitHubIcon as Github, InstagramIcon as Instagram, LinkedInIcon as Linkedin } from '@/components/brand-icons';
import { LogoMark } from '@/components/brand';
import type { SiteContent } from '@/lib/types';

export default function Footer({ content }: { content: SiteContent }) {
  const socials = content.socials.filter((s) => s.visible && s.url);
  const iconFor = (platform: string) => {
    switch (platform) {
      case 'github': return Github;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'whatsapp': return MessageCircle;
      default: return Mail;
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#040e22] text-white">
      <div aria-hidden="true" className="pointer-events-none select-none px-4 pt-14">
        <p className="text-display whitespace-nowrap text-center text-[18.5vw] font-bold leading-none tracking-tight text-white/[0.06] lg:text-[15rem]">FRANCIS</p>
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <div className="flex flex-col items-center gap-8 border-t border-white/10 pt-10 md:flex-row md:justify-between">
          <div className="flex items-center gap-4">
            <LogoMark size={44} />
            <div>
              <p className="font-display text-lg font-bold tracking-[0.22em]">FRANCIS</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-blue-300/70">Think · Create · Build · Innovate</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] uppercase tracking-[0.3em] text-blue-100/70" aria-label="Footer">
            <a href="/#about" className="transition hover:text-white">About</a>
            <a href="/#skills" className="transition hover:text-white">Skills</a>
            <a href="/#work" className="transition hover:text-white">Work</a>
            <a href="/#contact" className="transition hover:text-white">Contact</a>
            <Link href="/ai" className="flex items-center gap-1.5 text-blue-300 transition hover:text-white"><Sparkles size={12} /> FRANCIS AI</Link>
          </nav>

          <div className="flex items-center gap-3">
            {socials.map((social) => {
              const Icon = iconFor(social.platform);
              return (
                <a key={social.platform} href={social.url} target={social.url.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" aria-label={social.label ?? social.platform} className="rounded-full border border-white/10 p-2.5 text-blue-100/80 transition hover:border-electric hover:text-white">
                  <Icon size={16} />
                </a>
              );
            })}
            <Link href="/admin" aria-label="Admin" title="Admin control studio" className="rounded-full border border-white/10 p-2.5 text-blue-100/40 transition hover:border-electric hover:text-white">
              <ShieldCheck size={16} />
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 font-mono text-[9px] uppercase tracking-[0.3em] text-blue-200/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Yadlapalli Francis · FRANCIS</span>
          <span>Designed &amp; engineered by Francis · Visakhapatnam, India</span>
        </div>
      </div>
    </footer>
  );
}
