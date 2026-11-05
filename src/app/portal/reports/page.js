import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { PageHeader, Panel } from '@/components/page-header';
import { NoReport } from '@/components/portal-widgets';
import { ScoreBadge } from '@/components/score';
import { ScoreTrend } from '@/components/score-trend';
import { requireClient } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { getPortalData } from '@/lib/portal';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Past reports' };
export const dynamic = 'force-dynamic';

function Change({ value }) {
  if (value === null) return <span className="text-xs text-muted-foreground">First audit</span>;
  return (
    <span className={cn('tabular text-sm font-medium', value > 0 ? 'text-good' : value < 0 ? 'text-poor' : 'text-muted-foreground')}>
      {value > 0 ? `+${value}` : value === 0 ? 'No change' : value}
    </span>
  );
}

export default async function ReportsPage() {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');
  const { completed, running } = data;

  const rows = completed.map((audit, i) => ({
    ...audit,
    change: completed[i + 1] ? audit.overallScore - completed[i + 1].overallScore : null,
  }));
  const trend = [...completed].reverse().map((a) => ({ date: a.createdAt, score: a.overallScore }));

  return (
    <>
      <PageHeader title="Past reports" description="Every audit of your website, newest first." />
      {completed.length ? (
        <div className="space-y-6">
          <Panel title="Score over time" description="Your overall score from each monthly audit.">
            <ScoreTrend points={trend} />
          </Panel>
          <Panel title={`${completed.length} ${completed.length === 1 ? 'report' : 'reports'}`} bodyClassName="p-0">
            <ul className="divide-y">
              {rows.map((audit) => (
                <li key={audit.id} className="relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40">
                  <ScoreBadge score={audit.overallScore} className="h-9 min-w-11 text-base" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/portal/audits/${audit.id}`} className="font-medium after:absolute after:inset-0">
                      {formatDate(audit.createdAt, { month: 'long' })}
                    </Link>
                    <p className="mt-0.5">
                      <Change value={audit.change} />
                    </p>
                  </div>
                  {audit.pdfPath && (
                    <a
                      href={`/api/audit/${audit.id}/pdf`}
                      className="relative z-10 flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      <Download className="size-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : (
        <NoReport running={running} />
      )}
    </>
  );
}
