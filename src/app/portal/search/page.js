import { redirect } from 'next/navigation';
import { PageHeader, Panel } from '@/components/page-header';
import { NoReport, StatStrip } from '@/components/portal-widgets';
import { Competitors, QueryTable, Vitals } from '@/components/search-performance';
import { requireClient } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { coreVitals, getPortalData, mainRanking, searchTotals } from '@/lib/portal';

export const metadata = { title: 'Search performance' };
export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');
  const { client, latest, running } = data;

  if (!latest) {
    return (
      <>
        <PageHeader title="Search performance" description="How people find you on Google." />
        <NoReport running={running} />
      </>
    );
  }

  const { signals } = latest;
  const totals = searchTotals(signals.gsc);
  const ranking = mainRanking(signals.rankings);
  const vitals = coreVitals(signals.pagespeed);

  return (
    <>
      <PageHeader
        title="Search performance"
        description={`How people find ${client.name} on Google, from the ${formatDate(latest.createdAt, { month: 'long' })} audit.`}
      />
      <div className="space-y-6">
        {totals && (
          <StatStrip
            items={[
              { label: 'Clicks', value: totals.clicks.toLocaleString('en-IN'), note: 'Visits from Google search' },
              { label: 'Impressions', value: totals.impressions.toLocaleString('en-IN'), note: 'Times you appeared in results' },
              { label: 'Click-through rate', value: `${(totals.ctr * 100).toFixed(1)}%`, note: 'Share of impressions clicked' },
              {
                label: 'Average position',
                value: totals.position ? totals.position.toFixed(1) : '–',
                note: 'Across your top searches',
              },
            ]}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel title="Top searches" description="Google Search Console, last 28 days." bodyClassName="p-0">
            {totals ? (
              <QueryTable rows={signals.gsc.rows} />
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">Search Console data was not available for this audit.</p>
            )}
          </Panel>
          <Panel
            title="Who ranks above you"
            description={
              ranking ? `Google results for "${ranking.keyword}"${ranking.volume ? `, ${ranking.volume.toLocaleString('en-IN')} searches a month` : ''}.` : undefined
            }
            bodyClassName="p-0"
          >
            {ranking ? (
              <Competitors ranking={ranking} />
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">Ranking data was not available for this audit.</p>
            )}
          </Panel>
        </div>

        {vitals.length > 0 && (
          <Panel
            title="Page speed on mobile"
            description="Google's Core Web Vitals. Slow pages rank lower and lose visitors."
            bodyClassName="p-0"
          >
            <Vitals items={vitals} />
          </Panel>
        )}
      </div>
    </>
  );
}
