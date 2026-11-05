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

      <nav className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1" aria-label="Filter audits">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/admin/audits' : `/admin/audits?status=${f.key}`}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm transition-colors',
              filter.key === f.key ? 'bg-card font-medium shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
            <span className="tabular text-xs text-muted-foreground">{countFor[f.key]}</span>
          </Link>
        ))}
      </nav>

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
