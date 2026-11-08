import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './globals.css';
import { getPortfolioData } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPortfolioData();
  const seo = data.settings.seo;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://francis-platform.vercel.app';
  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.title, template: '%s — FRANCIS' },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'Yadlapalli Francis', url: siteUrl }],
    creator: 'Yadlapalli Francis',
    openGraph: {
      type: 'website',
      url: siteUrl,
      title: seo.title,
      description: seo.description,
      siteName: 'FRANCIS',
      images: [{ url: '/images/hero-backdrop.jpg', width: 1600, height: 900, alt: 'FRANCIS — Think. Create. Build. Innovate.' }],
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, images: ['/images/hero-backdrop.jpg'] },
    robots: { index: true, follow: true },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = {
  themeColor: '#0A0A0C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-ink antialiased">{children}</body>
    </html>
  );
}
