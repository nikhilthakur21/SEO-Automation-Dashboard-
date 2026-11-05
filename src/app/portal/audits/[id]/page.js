import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, Download } from 'lucide-react';
import { AuditReport } from '@/components/audit-report';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { requireClient } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { getPortalData } from '@/lib/portal';

export const metadata = { title: 'Report' };
export const dynamic = 'force-dynamic';

export default async function PortalAuditPage({ params }) {
  const session = await requireClient();
  const data = await getPortalData(session.clientId);
  if (!data) redirect('/login');

  const audit = data.completed.find((a) => a.id === params.id);
  if (!audit) notFound();

  return (
    <>
      <PageHeader
        title={`Report from ${formatDate(audit.createdAt, { month: 'long' })}`}
        description={audit.id === data.latest.id ? 'This is your latest report.' : 'An earlier monthly report.'}
        actions={
          audit.pdfPath && (
            <Button asChild variant="outline">
              <a href={`/api/audit/${audit.id}/pdf`}>
                <Download className="size-4" />
                Download PDF
              </a>
            </Button>
          )
        }
      >
        <Link href="/portal/reports" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          Past reports
        </Link>
      </PageHeader>
      <AuditReport result={audit.result} />
    </>
  );
}
