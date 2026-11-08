import { cn } from '@/lib/utils';

export function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn('shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id="fm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#071B3A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#fm-g)" />
      <rect x="1.2" y="1.2" width="61.6" height="61.6" rx="14" fill="none" stroke="rgba(160,200,255,0.35)" strokeWidth="1.6" />
      <path d="M20 16h26v9.5H31.5V31H44v9.5H31.5V50H20V16Z" fill="#EAF2FF" />
    </svg>
  );
}

export function Wordmark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('font-display font-bold tracking-[0.18em]', light ? 'text-white' : 'text-navy', className)}>
      FRANCIS
    </span>
  );
}
