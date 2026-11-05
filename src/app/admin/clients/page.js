import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AddClientDialog } from '@/components/add-client-dialog';
import { AutoRefresh } from '@/components/auto-refresh';
import { EmptyState, PageHeader } from '@/components/page-header';
import { RunAuditButton } from '@/components/run-audit-button';
import { ScoreBadge } from '@/components/score';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hostname, timeAgo } from '@/lib/format';

export const metadata = { title: 'Clients' };
export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, status: true, overallScore: true, createdAt: true },
      },
    },
  });

  const rows = clients.map((c) => ({
    ...c,
    latest: c.audits[0],
    score: c.audits.find((a) => a.status === 'COMPLETED')?.overallScore ?? null,
  }));
  const active = rows.some((r) => r.latest && ['QUEUED', 'RUNNING'].includes(r.latest.status));

  return (
    <>
      <AutoRefresh active={active} />
      <PageHeader
        title="Clients"
        description="Each client gets an audit every month. You can also run one by hand."
        actions={<AddClientDialog />}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add a client with their website and the first audit starts straight away."
          action={<AddClientDialog />}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Last audit</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id} className="relative">
                    <TableCell className="pl-5">
                      <Link href={`/admin/clients/${c.id}`} className="font-medium after:absolute after:inset-0">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {hostname(c.websiteUrl)}, {c.businessType.toLowerCase()}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.city}, {c.state}
                    </TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={c.score} />
                    </TableCell>
                    <TableCell>
                      {c.latest ? (
                        <span className="flex items-center gap-2">
                          <StatusBadge status={c.latest.status} />
                          <span className="text-xs text-muted-foreground">{timeAgo(c.latest.createdAt)}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <RunAuditButton clientId={c.id} variant="outline" size="sm" className="relative z-10" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y md:hidden">
            {rows.map((c) => (
              <li key={c.id} className="relative flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/clients/${c.id}`} className="block truncate font-medium after:absolute after:inset-0">
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {hostname(c.websiteUrl)}, {c.city}
                  </p>
                </div>
                <ScoreBadge score={c.score} />
                <RunAuditButton clientId={c.id} label="Run" variant="outline" size="sm" className="relative z-10" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
