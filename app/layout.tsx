import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getSiteContent } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const seo = content.seo;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.title, template: '%s · FRANCIS' },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'Yadlapalli Francis' }],
    creator: 'Yadlapalli Francis',
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: 'FRANCIS',
      title: seo.title,
      description: seo.description,
      images: [{ url: '/images/hero-backdrop.jpg', width: 1920, height: 1080, alt: 'FRANCIS — THINK. CREATE. BUILD. INNOVATE.' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['/images/hero-backdrop.jpg'],
    },
    robots: { index: true, follow: true },
    alternates: { canonical: SITE_URL },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071B3A',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  const accent = content.theme?.accent ?? '#2563EB';
  return (
    <html lang="en" style={{ ['--accent' as string]: accent }}>
      <body className="bg-white font-body text-ink antialiased">{children}</body>
    </html>
  );
}
