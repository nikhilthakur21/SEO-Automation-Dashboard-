import Link from 'next/link';
import { ArrowUpRight, ListChecks } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AuditTable } from '@/components/audit-table';
import { AutoRefresh } from '@/components/auto-refresh';
import { EmptyState, PageHeader, Panel } from '@/components/page-header';
import { QueuePanel } from '@/components/queue-panel';
import { ScoreBadge } from '@/components/score';
import { StatStrip } from '@/components/stat-strip';
import { Button } from '@/components/ui/button';
import { formatDate, hostname } from '@/lib/format';
import { scoreTone, VERDICTS } from '@/lib/score';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [clientCount, monthCount, recent, clients] = await Promise.all([
    prisma.client.count(),
    prisma.audit.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { client: { select: { name: true, websiteUrl: true } } },
    }),
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        audits: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { overallScore: true, result: true },
        },
      },
    }),
  ]);

  const scored = clients.filter((c) => c.audits[0]);
  const average = scored.length
    ? Math.round(scored.reduce((sum, c) => sum + c.audits[0].overallScore, 0) / scored.length)
    : null;
  const critical = scored.reduce((n, c) => n + (c.audits[0].result?.critical_issues?.length || 0), 0);
  const lowest = [...scored].sort((a, b) => a.audits[0].overallScore - b.audits[0].overallScore).slice(0, 5);
  const active = recent.some((a) => a.status === 'QUEUED' || a.status === 'RUNNING');

  return (
    <>
      <AutoRefresh active={active} />
      <PageHeader title="Overview" description="Audit activity across every client." />

      <StatStrip
        items={[
          { label: 'Clients', value: clientCount, note: 'Active client accounts' },
          { label: 'Audits this month', value: monthCount, note: `Since ${formatDate(monthStart)}` },
          {
            label: 'Average score',
            value: average ?? '–',
            suffix: average === null ? null : '/100',
            note: average === null ? 'No completed audits yet' : `${VERDICTS[scoreTone(average)]}, latest audit per client`,
          },
          { label: 'Critical issues', value: scored.length ? critical : '–', note: 'Open across latest audits' },
        ]}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Recent audits"
          actions={
            <Button asChild variant="ghost" size="sm" className="-my-1">
              <Link href="/admin/audits">
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {recent.length ? (
            <AuditTable audits={recent} />
          ) : (
            <div className="p-5">
              <EmptyState
                icon={ListChecks}
                title="No audits yet"
                description="Open a client and run the first audit. Its progress shows up here."
              />
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <QueuePanel />
          <Panel title="Needs attention" description="Lowest scores from the latest audits." bodyClassName="p-0">
            {lowest.length ? (
              <ul className="divide-y">
                {lowest.map((c) => (
                  <li key={c.id} className="relative flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/clients/${c.id}`} className="block truncate text-sm font-medium after:absolute after:inset-0">
                        {c.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{hostname(c.websiteUrl)}</p>
                    </div>
                    <ScoreBadge score={c.audits[0].overallScore} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">Scores appear once audits complete.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
