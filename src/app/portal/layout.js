import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { requireClient } from '@/lib/auth';
import { hostname } from '@/lib/format';
import { getPortalData } from '@/lib/portal';

export default async function PortalLayout({ children }) {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');

  const { client, latest, completed } = data;
  const result = latest?.result;

  return (
    <AppShell
      variant="client"
      account={{ name: client.name, email: session.email }}
      topbar={{ title: client.name, subtitle: hostname(client.websiteUrl), href: client.websiteUrl }}
      action={
        latest?.pdfPath
          ? { href: `/api/audit/${latest.id}/pdf`, label: 'Download latest PDF', short: 'PDF', icon: 'download', external: true }
          : null
      }
      counts={{
        fixFirst: result?.critical_issues.length,
        quickWins: result?.quick_wins.length,
        recommendations: result?.recommendations.length,
        reports: completed.length,
      }}
    >
      {children}
    </AppShell>
  );
}
