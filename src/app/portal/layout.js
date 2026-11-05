import { redirect } from 'next/navigation';
import { PortalShell } from '@/components/portal-shell';
import { requireClient } from '@/lib/auth';
import { getPortalData } from '@/lib/portal';

export default async function PortalLayout({ children }) {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');

  const { client, latest, completed } = data;
  const result = latest?.result;

  return (
    <PortalShell
      client={{ name: client.name, websiteUrl: client.websiteUrl, email: session.email }}
      counts={{
        fixFirst: result?.critical_issues.length,
        quickWins: result?.quick_wins.length,
        recommendations: result?.recommendations.length,
        reports: completed.length,
      }}
      latestPdf={latest?.pdfPath ? latest.id : null}
    >
      {children}
    </PortalShell>
  );
}
