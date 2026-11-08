import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-navy text-skylight">
      <div
        className="pointer-events-none absolute inset-0 bg-hero-grid bg-grid opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent-rgb, 225 6 0) / 0.32),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="relative flex max-w-lg flex-col items-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.45em] text-electric">Error 404</p>
        <h1 className="display-tight mt-4 text-7xl font-bold text-white sm:text-8xl">
          LOST<span className="text-electric">.</span>
        </h1>
        <p className="mt-6 text-base leading-7 text-skylight/80">
          This scene doesn&rsquo;t exist in the FRANCIS cut. The page you are looking for was moved,
          renamed or never rendered.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-electric px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#c00500] focus:outline-none focus:ring-2 focus:ring-skylight"
          >
            Back to FRANCIS
          </Link>
          <Link
            href="/ai"
            className="rounded-full border border-skylight/25 px-7 py-3 text-sm font-semibold text-skylight transition hover:border-skylight/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-skylight"
          >
            Ask FRANCIS AI
          </Link>
        </div>
      </div>
    </main>
  );
}
