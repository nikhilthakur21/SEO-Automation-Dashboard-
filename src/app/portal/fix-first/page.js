import { redirect } from 'next/navigation';
import { PageHeader, Panel } from '@/components/page-header';
import { NoReport, NumberedList } from '@/components/portal-widgets';
import { RecommendationItem } from '@/components/recommendation-list';
import { requireClient } from '@/lib/auth';
import { getPortalData } from '@/lib/portal';

export const metadata = { title: 'Fix first' };
export const dynamic = 'force-dynamic';

export default async function FixFirstPage() {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');
  const { latest, running } = data;

  if (!latest) {
    return (
      <>
        <PageHeader title="Fix first" description="The problems holding your site back the most." />
        <NoReport running={running} />
      </>
    );
  }

  const { critical_issues: issues, recommendations } = latest.result;
  const fixes = recommendations.filter((r) => r.priority === 'CRITICAL');

  return (
    <>
      <PageHeader
        title="Fix first"
        description="The problems holding your site back the most, in the order we would tackle them."
      />
      <div className="space-y-6">
        <Panel
          title={`${issues.length} critical ${issues.length === 1 ? 'issue' : 'issues'}`}
          description="Until these are fixed, other improvements will have less effect."
          bodyClassName="p-0"
        >
          {issues.length ? (
            <NumberedList items={issues} tone="poor" />
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">No critical issues this month.</p>
          )}
        </Panel>

        {fixes.length > 0 && (
          <Panel title="How to fix them" description="What to change, and how you will know it worked." bodyClassName="p-0">
            <ul className="divide-y">
              {fixes.map((item, i) => (
                <RecommendationItem key={i} item={item} />
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
