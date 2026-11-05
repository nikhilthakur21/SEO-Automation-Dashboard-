import { cn } from '@/lib/utils';
import { scoreTone, VERDICTS, CATEGORY_LABELS } from '@/lib/score';

const TEXT = { good: 'text-good', warn: 'text-warn', poor: 'text-poor', none: 'text-muted-foreground' };
const FILL = { good: 'bg-good', warn: 'bg-warn', poor: 'bg-poor', none: 'bg-muted-foreground' };
const SOFT = {
  good: 'bg-good/10 text-good',
  warn: 'bg-warn/10 text-warn',
  poor: 'bg-poor/10 text-poor',
  none: 'bg-muted text-muted-foreground',
};

export function ScoreBadge({ score, className }) {
  const tone = scoreTone(score);
  return (
    <span
      className={cn(
        'tabular inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-sm font-semibold',
        SOFT[tone],
        className,
      )}
    >
      {score ?? '–'}
    </span>
  );
}

function Zone({ tone, width, active }) {
  return <div className={cn('h-full rounded-sm', FILL[tone], active ? 'opacity-90' : 'opacity-15')} style={{ width }} />;
}

export function ScoreScale({ score, className }) {
  const tone = scoreTone(score);
  return (
    <div className={className}>
      <div className="flex items-end gap-3">
        <span className="tabular text-6xl font-semibold leading-none tracking-tight sm:text-7xl">{score}</span>
        <div className="pb-1">
          <p className={cn('text-sm font-semibold', TEXT[tone])}>{VERDICTS[tone]}</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>
      <div className="relative mt-6" role="img" aria-label={`Score ${score} out of 100`}>
        <div className="flex h-2.5 gap-0.5">
          <Zone tone="poor" width="50%" active={tone === 'poor'} />
          <Zone tone="warn" width="40%" active={tone === 'warn'} />
          <Zone tone="good" width="10%" active={tone === 'good'} />
        </div>
        <div
          className="absolute -top-1.5 h-[22px] w-[3px] -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card"
          style={{ left: `${score}%` }}
        />
      </div>
      <div className="tabular relative mt-2 h-4 text-[11px] text-muted-foreground">
        <span className="absolute left-0">0</span>
        <span className="absolute left-1/2 -translate-x-1/2">50</span>
        <span className="absolute left-[90%] -translate-x-1/2">90</span>
      </div>
    </div>
  );
}

export function ScoreBreakdown({ breakdown, className }) {
  return (
    <div className={cn('divide-y', className)}>
      {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
        const value = breakdown?.[key] ?? 0;
        const tone = scoreTone(value);
        return (
          <div key={key} className="grid grid-cols-[7.5rem_1fr_2.25rem] items-center gap-3 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-muted">
              <span className={cn('block h-full rounded-full', FILL[tone])} style={{ width: `${value}%` }} />
            </span>
            <span className="tabular text-right font-semibold">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
