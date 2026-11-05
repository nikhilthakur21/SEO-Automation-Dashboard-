import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AuditTable } from '@/components/audit-table';
import { AutoRefresh } from '@/components/auto-refresh';
import { EmptyState, PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Audits' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress', where: { status: { in: ['QUEUED', 'RUNNING'] } } },
  { key: 'completed', label: 'Completed', where: { status: 'COMPLETED' } },
  { key: 'failed', label: 'Failed', where: { status: 'FAILED' } },
];

export default async function AuditsPage({ searchParams }) {
  const filter = FILTERS.find((f) => f.key === searchParams.status) || FILTERS[0];

  const [audits, counts] = await Promise.all([
    prisma.audit.findMany({
      where: filter.where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { client: { select: { name: true, websiteUrl: true } } },
    }),
    prisma.audit.groupBy({ by: ['status'], _count: true }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const countFor = {
    all: Object.values(byStatus).reduce((a, b) => a + b, 0),
    active: (byStatus.QUEUED || 0) + (byStatus.RUNNING || 0),
    completed: byStatus.COMPLETED || 0,
    failed: byStatus.FAILED || 0,
  };

  return (
    <>
      <AutoRefresh active={countFor.active > 0} />
      <PageHeader title="Audits" description="Manual runs and the monthly schedule, newest first." />

      <div className="mb-4 overflow-x-auto">
        <nav className="inline-flex gap-1 rounded-lg bg-secondary p-1" aria-label="Filter audits">
          {FILTERS.map((f) => {
            const active = filter.key === f.key;
            return (
              <Link
                key={f.key}
                href={f.key === 'all' ? '/admin/audits' : `/admin/audits?status=${f.key}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                  active
                    ? 'bg-card font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'tabular min-w-5 rounded px-1.5 text-center text-xs',
                    active ? 'bg-secondary text-foreground' : 'bg-card/70 text-muted-foreground',
                  )}
                >
                  {countFor[f.key]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {audits.length ? (
        <div className="rounded-lg border bg-card">
          <AuditTable audits={audits} />
        </div>
      ) : (
        <EmptyState icon={ListChecks} title="Nothing here" description="No audits match this filter yet." />
      )}
    </>
  );
}
