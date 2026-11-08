import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource-variable/fraunces/full.css';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'FRANCIS Ops — Control Studio', template: '%s — FRANCIS Ops' },
  description: 'Private operations console for the FRANCIS platform. Messages, content, AI and publishing — one room.',
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
};

/**
 * FRANCIS Ops is a deliberately separate surface — its own HTML document,
 * no public-site chrome, no analytics, noindex. Access is allowlist-gated
 * inside /admin itself (Supabase auth + admin_users).
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-mist text-ink antialiased">{children}</body>
    </html>
  );
}
