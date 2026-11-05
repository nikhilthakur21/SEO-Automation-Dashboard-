import { redirect } from 'next/navigation';
import { AuditLive } from '@/components/audit-live';
import { ScoreHero } from '@/components/audit-report';
import { PageHeader } from '@/components/page-header';
import { DeliveryNote, NoReport, PreviewPanel } from '@/components/portal-widgets';
import { StatStrip } from '@/components/stat-strip';
import { requireClient } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { getPortalData, mainRanking, nextAuditDate, searchTotals } from '@/lib/portal';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

function glance(latest, previous) {
  const { result, signals } = latest;
  const ranking = mainRanking(signals?.rankings);
  const search = searchTotals(signals?.gsc);
  const speed = signals?.pagespeed?.categories?.performance?.score;
  const speedScore = typeof speed === 'number' ? Math.round(speed * 100) : null;
  const change = previous ? result.overall_score - previous.overallScore : null;

  return [
    {
      label: 'Score change',
      value: change === null ? 'New' : change > 0 ? `+${change}` : `${change}`,
      className: change > 0 ? 'text-good' : change < 0 ? 'text-poor' : undefined,
      note: previous ? `Since ${formatDate(previous.createdAt)}` : 'This is your first audit',
    },
    {
      label: 'Google position',
      value: ranking?.position ? `#${ranking.position}` : '–',
      note: ranking ? `For "${ranking.keyword}"` : 'No ranking data yet',
    },
    {
      label: 'Search clicks',
      value: search ? search.clicks.toLocaleString('en-IN') : '–',
      note: search ? `From ${search.impressions.toLocaleString('en-IN')} impressions in 28 days` : 'No Search Console data yet',
    },
    {
      label: 'Mobile speed',
      value: speedScore ?? '–',
      suffix: speedScore === null ? null : '/100',
      note: 'PageSpeed performance score',
    },
  ];
}

export default async function PortalOverview() {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');
  const { latest, previous, running } = data;

  return (
    <>
      <PageHeader
        title="Website health"
        description={latest ? `Last checked ${formatDate(latest.createdAt, { month: 'long' })}` : 'Your monthly SEO report'}
      />

      {running && (
        <div className="mb-6">
          <AuditLive
            compact
            auditId={running.id}
            initial={{ status: running.status, progress: running.progress, currentStep: running.currentStep }}
          />
        </div>
      )}

      {latest ? (
        <div className="space-y-6">
          <ScoreHero result={latest.result} />
          <StatStrip items={glance(latest, previous)} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PreviewPanel
              title="Fix first"
              description="The problems holding your site back most."
              items={latest.result.critical_issues}
              href="/portal/fix-first"
              tone="poor"
              empty="No critical issues this month."
            />
            <PreviewPanel
              title="Quick wins"
              description="Small changes, about two hours each."
              items={latest.result.quick_wins}
              href="/portal/quick-wins"
              empty="No quick wins this month."
            />
          </div>
          <DeliveryNote audit={latest} nextAudit={nextAuditDate(latest)} />
        </div>
      ) : (
        <NoReport running={running} />
      )}
    </>
  );
}
