import Link from 'next/link';
import { ScoreBadge } from '@/components/score';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime, hostname, timeAgo } from '@/lib/format';

const TRIGGER = { manual: 'Manual', cron: 'Scheduled' };

function Status({ audit }) {
  return (
    <span className="flex items-center gap-2">
      <StatusBadge status={audit.status} />
      {audit.status === 'RUNNING' && <span className="tabular text-xs text-muted-foreground">{audit.progress}%</span>}
    </span>
  );
}

export function AuditTable({ audits, showClient = true, basePath = '/admin/audits' }) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">{showClient ? 'Client' : 'Audit'}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead className="pr-5 text-right">Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id} className="relative">
                <TableCell className="pl-5">
                  <Link href={`${basePath}/${audit.id}`} className="font-medium after:absolute after:inset-0">
                    {showClient ? audit.client.name : formatDateTime(audit.createdAt)}
                  </Link>
                  {showClient && <p className="text-xs text-muted-foreground">{hostname(audit.client.websiteUrl)}</p>}
                </TableCell>
                <TableCell>
                  <Status audit={audit} />
                </TableCell>
                <TableCell className="text-right">
                  <ScoreBadge score={audit.overallScore} />
                </TableCell>
                <TableCell className="text-muted-foreground">{TRIGGER[audit.triggeredBy] || audit.triggeredBy}</TableCell>
                <TableCell className="pr-5 text-right text-muted-foreground" title={formatDateTime(audit.createdAt)}>
                  {timeAgo(audit.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {audits.map((audit) => (
          <li key={audit.id} className="relative flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <Link href={`${basePath}/${audit.id}`} className="block truncate font-medium after:absolute after:inset-0">
                {showClient ? audit.client.name : formatDateTime(audit.createdAt)}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Status audit={audit} />
                <span>{timeAgo(audit.createdAt)}</span>
              </div>
            </div>
            <ScoreBadge score={audit.overallScore} />
          </li>
        ))}
      </ul>
    </>
  );
}
