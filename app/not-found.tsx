import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Signal lost',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="hero-scene relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center text-white">
      <div className="hero-grid absolute inset-0" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.5em] text-blue-300/80">Error · 404</p>
        <h1 className="text-display mt-6 text-7xl font-bold sm:text-8xl">
          4<span className="text-electric">0</span>4
        </h1>
        <p className="mt-4 max-w-md text-balance text-blue-100/85">
          This scene does not exist in the FRANCIS story. The page you are looking for has drifted off the storyboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-shine rounded-full bg-electric px-6 py-3 font-display text-sm font-semibold tracking-wide text-white transition hover:bg-blue-500">
            Return to FRANCIS
          </Link>
          <Link href="/ai" className="rounded-full border border-blue-300/30 px-6 py-3 font-display text-sm font-semibold tracking-wide text-blue-100 transition hover:border-blue-300/60 hover:text-white">
            Ask FRANCIS AI
          </Link>
        </div>
      </div>
    </main>
  );
}
