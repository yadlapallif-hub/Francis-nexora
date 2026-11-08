export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-navy">
      <div className="flex flex-col items-center gap-6">
        <svg width="72" height="72" viewBox="0 0 64 64" className="animate-pulse">
          <rect width="64" height="64" rx="14" fill="#17171A" />
          <path d="M20 46V18h26v8H30v6h12v8H30v6z" style={{ fill: 'var(--accent)' }} />
          <circle cx="45" cy="45" r="4" fill="#F5F5F4" />
        </svg>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse-dot rounded-full bg-skylight"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-skylight/60">
          FRANCIS
        </p>
      </div>
    </div>
  );
}
