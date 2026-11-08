import { cn } from '@/lib/cn';

export function SceneTag({ index, label, dark = false }: { index: string; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <span
        className={cn(
          'font-mono text-[11px] font-medium tracking-[0.4em]',
          dark ? 'text-electric' : 'text-electric'
        )}
      >
        {index}
      </span>
      <span className={cn('h-px w-14', dark ? 'bg-skylight/25' : 'bg-electric/30')} />
      <span
        className={cn(
          'font-mono text-[11px] font-medium uppercase tracking-[0.4em]',
          dark ? 'text-skylight/60' : 'text-navy/50'
        )}
      >
        {label}
      </span>
    </div>
  );
}
