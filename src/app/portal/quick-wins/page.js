import { redirect } from 'next/navigation';
import { PageHeader, Panel } from '@/components/page-header';
import { NoReport, NumberedList } from '@/components/portal-widgets';
import { RecommendationItem } from '@/components/recommendation-list';
import { requireClient } from '@/lib/auth';
import { getPortalData } from '@/lib/portal';

export const metadata = { title: 'Quick wins' };
export const dynamic = 'force-dynamic';

export default async function QuickWinsPage() {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');
  const { latest, running } = data;

  if (!latest) {
    return (
      <>
        <PageHeader title="Quick wins" description="Small changes that each take about two hours or less." />
        <NoReport running={running} />
      </>
    );
  }

  const { quick_wins: wins, recommendations } = latest.result;
  const related = recommendations.filter((r) => r.effort === 'Hours' && r.priority !== 'CRITICAL');

  return (
    <>
      <PageHeader
        title="Quick wins"
        description="Small changes that each take about two hours or less. A good place to start this week."
      />
      <div className="space-y-6">
        <Panel
          title={`${wins.length} quick ${wins.length === 1 ? 'win' : 'wins'}`}
          description="Your web developer can usually do these in one sitting."
          bodyClassName="p-0"
        >
          {wins.length ? (
            <NumberedList items={wins} />
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">No quick wins this month.</p>
          )}
        </Panel>

        {related.length > 0 && (
          <Panel title="Other fixes that take hours, not days" bodyClassName="p-0">
            <ul className="divide-y">
              {related.map((item, i) => (
                <RecommendationItem key={i} item={item} />
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
