import { cn } from '@/lib/cn';

export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn('h-9 w-9', className)} role="img" aria-label="FRANCIS logo">
      <rect width="64" height="64" rx="14" fill={mono ? 'currentColor' : '#0A0A0C'} />
      <path d="M20 46V18h26v8H30v6h12v8H30v6z" fill={mono ? '#fff' : '#E10600'} />
      <circle cx="45" cy="45" r="4" fill={mono ? '#fff' : '#F5F5F4'} />
    </svg>
  );
}

export function Wordmark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('font-display text-xl font-bold leading-none tracking-[0.08em]', light ? 'text-white' : 'text-navy', className)}>
      FRANCIS
      <span className="text-electric">.</span>
    </span>
  );
}
