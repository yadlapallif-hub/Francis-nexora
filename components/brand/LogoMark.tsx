import { cn } from '@/lib/cn';

export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn('h-9 w-9', className)} role="img" aria-label="FRANCIS logo">
      {!mono && (
        <defs>
          <linearGradient id="lm-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3AD2DE" />
            <stop offset="0.5" stopColor="#0E8A9C" />
            <stop offset="1" stopColor="#0B5E6D" />
          </linearGradient>
          <linearGradient id="lm-f" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#35C4CE" />
            <stop offset="0.55" stopColor="#0E8A9C" />
            <stop offset="1" stopColor="#0E6E7E" />
          </linearGradient>
        </defs>
      )}
      <rect
        width="64" height="64" rx="15"
        fill={mono ? 'currentColor' : '#062A3A'}
        stroke={mono ? 'transparent' : 'url(#lm-ring)'}
        strokeWidth={mono ? 0 : 2}
      />
      <path d="M20 46V18h26v8H30v6h12v8H30v6z" fill={mono ? '#fff' : 'url(#lm-f)'} />
      <circle cx="45" cy="45" r="3.6" fill="#F2F7F7" />
    </svg>
  );
}

export function Wordmark({ className, light = false, multi = false }: { className?: string; light?: boolean; multi?: boolean }) {
  return (
    <span
      className={cn(
        'font-display text-xl font-bold leading-none tracking-[0.08em]',
        multi ? (light ? 'shimmer-multi' : 'shimmer-multi-dark') : light ? 'text-white' : 'text-navy',
        className
      )}
    >
      FRANCIS
      <span className="text-electric">.</span>
    </span>
  );
}
