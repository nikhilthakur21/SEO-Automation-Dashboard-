'use client';

import { useMemo, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_LABELS, RECOMMENDATION_CATEGORIES } from '@/lib/score';

const PRIORITY_STYLES = {
  CRITICAL: 'bg-poor text-white',
  HIGH: 'bg-poor/10 text-poor',
  MEDIUM: 'bg-warn/10 text-warn',
  LOW: 'bg-muted text-muted-foreground',
};

const FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PREVIEW = 6;

export function RecommendationItem({ item }) {
  return (
    <li className="grid gap-3 px-5 py-4 md:grid-cols-[9rem_1fr_9rem] md:gap-6">
      <div className="flex items-center gap-2 md:flex-col md:items-start md:gap-1.5">
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-semibold', PRIORITY_STYLES[item.priority])}>
          {PRIORITY_LABELS[item.priority]}
        </span>
        <span className="text-xs text-muted-foreground">{RECOMMENDATION_CATEGORIES[item.category] || item.category}</span>
      </div>
      <div className="min-w-0">
        <p className="font-medium leading-snug">{item.finding}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.fix}</p>
        <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <CircleCheck className="mt-px size-3.5 shrink-0 text-good" />
          {item.falsifiability_check}
        </p>
      </div>
      <dl className="flex gap-4 text-sm md:flex-col md:gap-1.5">
        <div>
          <dt className="text-xs text-muted-foreground">Impact</dt>
          <dd>{item.estimated_impact}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Effort</dt>
          <dd>{item.effort}</dd>
        </div>
      </dl>
    </li>
  );
}

export function RecommendationList({
  recommendations,
  title = 'Recommendations',
  description = 'Each fix comes with a way to check that it worked.',
  preview = true,
}) {
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(!preview);

  const counts = useMemo(() => {
    const c = { ALL: recommendations.length };
    for (const r of recommendations) c[r.priority] = (c[r.priority] || 0) + 1;
    return c;
  }, [recommendations]);

  const matching = filter === 'ALL' ? recommendations : recommendations.filter((r) => r.priority === filter);
  const visible = expanded ? matching : matching.slice(0, PREVIEW);
  const hidden = matching.length - visible.length;

  return (
    <section className="rounded-lg border bg-card">
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter by priority">
          {FILTERS.filter((f) => f === 'ALL' || counts[f]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors',
                filter === f ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'ALL' ? 'All' : PRIORITY_LABELS[f]}
              <span className="tabular text-xs text-muted-foreground">{counts[f]}</span>
            </button>
          ))}
        </div>
      </header>
      <ul className="divide-y">
        {visible.map((r, i) => (
          <RecommendationItem key={`${r.priority}-${i}`} item={r} />
        ))}
      </ul>
      {hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full border-t px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-secondary/50"
        >
          Show {hidden} more
        </button>
      )}
    </section>
  );
}
