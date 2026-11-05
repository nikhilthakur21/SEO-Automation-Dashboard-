import { cn } from '@/lib/utils';

const STYLES = {
  QUEUED: 'bg-muted text-muted-foreground',
  RUNNING: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-good/10 text-good',
  FAILED: 'bg-poor/10 text-poor',
};

const LABELS = { QUEUED: 'Queued', RUNNING: 'Running', COMPLETED: 'Completed', FAILED: 'Failed' };

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium',
        STYLES[status],
        className,
      )}
    >
      {status === 'RUNNING' && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
      )}
      {LABELS[status]}
    </span>
  );
}
