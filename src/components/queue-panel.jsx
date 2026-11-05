'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const WORKER = {
  online: { label: 'Worker online', dot: 'bg-good' },
  offline: { label: 'Worker waking up', dot: 'bg-warn' },
  inline: { label: 'Processed by cron', dot: 'bg-primary' },
};

const COUNTS = [
  ['waiting', 'Waiting'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['failed', 'Failed'],
];

export function QueuePanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/queue', { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const worker = data ? WORKER[data.worker] : null;

  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">Job queue</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            BullMQ on <code className="rounded bg-muted px-1 py-0.5 text-xs">seo-audit-jobs</code>
          </p>
        </div>
        {worker && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', worker.dot)} />
            {worker.label}
          </span>
        )}
      </header>
      <dl className="grid grid-cols-4 divide-x">
        {COUNTS.map(([key, label]) => (
          <div key={key} className="px-3 py-4 text-center">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={cn('tabular mt-1 text-xl font-semibold', key === 'active' && data?.counts.active > 0 && 'text-primary')}>
              {data ? data.counts[key] : '–'}
            </dd>
          </div>
        ))}
      </dl>
      {error && <p className="border-t px-5 py-3 text-xs text-poor">Could not reach Redis. Check REDIS_URL.</p>}
    </section>
  );
}
