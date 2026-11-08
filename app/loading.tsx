export default function Loading() {
  return (
    <div className="hero-scene flex min-h-screen items-center justify-center" role="status" aria-label="Loading FRANCIS">
      <div className="flex flex-col items-center gap-6">
        <svg width="72" height="72" viewBox="0 0 64 64" className="animate-pulse" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#2563EB" />
          <path d="M20 16h26v9.5H31.5V31H44v9.5H31.5V50H20V16Z" fill="#EAF2FF" />
        </svg>
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-blue-300/80">FRANCIS</p>
      </div>
    </div>
  );
}
