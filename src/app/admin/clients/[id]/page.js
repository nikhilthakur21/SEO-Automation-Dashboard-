import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink, ListChecks } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AuditTable } from '@/components/audit-table';
import { AutoRefresh } from '@/components/auto-refresh';
import { DeleteClientButton } from '@/components/delete-client-button';
import { EmptyState, PageHeader, Panel } from '@/components/page-header';
import { RunAuditButton } from '@/components/run-audit-button';
import { ScoreBreakdown, ScoreScale } from '@/components/score';
import { ScoreTrend } from '@/components/score-trend';
import { Button } from '@/components/ui/button';
import { formatDate, hostname } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const client = await prisma.client.findUnique({ where: { id: params.id }, select: { name: true } });
  return { title: client?.name || 'Client' };
}

function Detail({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children || <span className="text-muted-foreground">Not set</span>}</dd>
    </div>
  );
}

export default async function ClientPage({ params }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          progress: true,
          overallScore: true,
          scoreBreakdown: true,
          triggeredBy: true,
          createdAt: true,
          completedAt: true,
        },
      },
    },
  });
  if (!client) notFound();

  const completed = client.audits.filter((a) => a.status === 'COMPLETED');
  const latest = completed[0];
  const active = client.audits.some((a) => a.status === 'QUEUED' || a.status === 'RUNNING');
  const trend = [...completed].reverse().map((a) => ({ date: a.createdAt, score: a.overallScore }));

  return (
    <>
      <AutoRefresh active={active} />
      <PageHeader
        title={client.name}
        description={
          <a href={client.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
            {hostname(client.websiteUrl)}
            <ExternalLink className="size-3" />
          </a>
        }
        actions={
          <>
            <DeleteClientButton clientId={client.id} name={client.name} />
            {latest && (
              <Button asChild variant="outline">
                <Link href={`/admin/audits/${latest.id}`}>Latest report</Link>
              </Button>
            )}
            <RunAuditButton clientId={client.id} />
          </>
        }
      >
        <Link href="/admin/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          Clients
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {latest ? (
            <section className="rounded-lg border bg-card p-5 sm:p-6">
              <div className="grid gap-8 md:grid-cols-2 md:gap-10">
                <div>
                  <p className="mb-4 text-sm text-muted-foreground">Latest score, {formatDate(latest.createdAt)}</p>
                  <ScoreScale score={latest.overallScore} />
                </div>
                <ScoreBreakdown breakdown={latest.scoreBreakdown} className="-my-2.5 md:self-center" />
              </div>
            </section>
          ) : null}

          <Panel title="Score over time" description="Overall score from each completed audit.">
            <ScoreTrend points={trend} />
          </Panel>

          <Panel title="Audit history" bodyClassName="p-0">
            {client.audits.length ? (
              <AuditTable audits={client.audits} showClient={false} />
            ) : (
              <div className="p-5">
                <EmptyState icon={ListChecks} title="No audits yet" description="Run the first audit to score this site." />
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Details" bodyClassName="py-2">
          <dl className="divide-y">
            <Detail label="Business">{client.businessType}</Detail>
            <Detail label="Location">
              {client.city}, {client.state}
            </Detail>
            <Detail label="WhatsApp">{client.whatsapp}</Detail>
            <Detail label="Email">{client.email}</Detail>
            <Detail label="Client since">{formatDate(client.createdAt)}</Detail>
            <Detail label="Audits run">{client.audits.length}</Detail>
          </dl>
          <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            Reports go out on WhatsApp and email after every audit. The client signs in to the portal with this email.
          </p>
        </Panel>
      </div>
    </>
  );
}
