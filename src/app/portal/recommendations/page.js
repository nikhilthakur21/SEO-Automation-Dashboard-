import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { NoReport } from '@/components/portal-widgets';
import { RecommendationList } from '@/components/recommendation-list';
import { requireClient } from '@/lib/auth';
import { getPortalData } from '@/lib/portal';

export const metadata = { title: 'Recommendations' };
export const dynamic = 'force-dynamic';

export default async function RecommendationsPage() {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');
  const { latest, running } = data;

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Every fix from your latest audit, ranked by priority, with a way to check it worked."
      />
      {latest ? (
        <RecommendationList
          recommendations={latest.result.recommendations}
          title={`${latest.result.recommendations.length} recommendations`}
          description="Filter by priority to plan the work."
          preview={false}
        />
      ) : (
        <NoReport running={running} />
      )}
    </>
  );
}
