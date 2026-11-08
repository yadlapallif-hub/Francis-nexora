import { cn } from '@/lib/cn';

export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn('h-9 w-9', className)} role="img" aria-label="FRANCIS logo">
      {!mono && (
        <defs>
          <linearGradient id="lm-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF3D2E" />
            <stop offset="0.5" stopColor="#E10600" />
            <stop offset="1" stopColor="#8F0B00" />
          </linearGradient>
          <linearGradient id="lm-f" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF4A33" />
            <stop offset="0.55" stopColor="#E10600" />
            <stop offset="1" stopColor="#A00D00" />
          </linearGradient>
        </defs>
      )}
      <rect
        width="64" height="64" rx="15"
        fill={mono ? 'currentColor' : '#0A0A0C'}
        stroke={mono ? 'transparent' : 'url(#lm-ring)'}
        strokeWidth={mono ? 0 : 2}
      />
      <path d="M20 46V18h26v8H30v6h12v8H30v6z" fill={mono ? '#fff' : 'url(#lm-f)'} />
      <circle cx="45" cy="45" r="3.6" fill="#F5F5F4" />
    </svg>
  );
}

export function Wordmark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={cn(
        'font-display text-xl font-bold leading-none tracking-[0.08em]',
        light ? 'text-white' : 'text-navy',
        className
      )}
    >
      FRANCIS
      <span className="text-electric">.</span>
    </span>
  );
}
