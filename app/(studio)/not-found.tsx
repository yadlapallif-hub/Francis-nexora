import Link from 'next/link';

export default function StudioNotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-navy px-6 text-center text-skylight">
      <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-electric">FRANCIS Ops · 404</p>
      <h1 className="mt-4 font-display text-4xl font-black text-white">No room at this address.</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-skylight/65">
        Whatever you were looking for does not exist inside the control studio.
      </p>
      <Link
        href="/admin"
        className="mt-8 rounded-full bg-electric px-6 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition hover:bg-red-600"
      >
        Back to the studio
      </Link>
    </main>
  );
}
