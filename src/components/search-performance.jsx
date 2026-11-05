import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const TONE = {
  good: { label: 'Good', text: 'text-good', dot: 'bg-good' },
  warn: { label: 'Needs work', text: 'text-warn', dot: 'bg-warn' },
  poor: { label: 'Poor', text: 'text-poor', dot: 'bg-poor' },
};

const pct = (n) => `${(n * 100).toFixed(1)}%`;

export function QueryTable({ rows }) {
  const sorted = [...rows].sort((a, b) => b.clicks - a.clicks);
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Search term</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="pr-5 text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular">
            {sorted.map((r) => (
              <TableRow key={r.query}>
                <TableCell className="pl-5 font-medium">{r.query}</TableCell>
                <TableCell className="text-right">{r.clicks}</TableCell>
                <TableCell className="text-right">{r.impressions.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">{pct(r.ctr)}</TableCell>
                <TableCell className={cn('pr-5 text-right', r.position > 10 && 'text-poor')}>{r.position}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y sm:hidden">
        {sorted.map((r) => (
          <li key={r.query} className="px-4 py-3">
            <p className="font-medium">{r.query}</p>
            <p className="tabular mt-1 text-xs text-muted-foreground">
              {r.clicks} clicks, {r.impressions.toLocaleString('en-IN')} impressions, position {r.position}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Competitors({ ranking }) {
  return (
    <ol className="divide-y">
      {ranking.items.map((item) => {
        const own = item.rank_absolute === ranking.position;
        return (
          <li key={item.domain} className={cn('flex items-center gap-3 px-5 py-3', own && 'bg-primary/5')}>
            <span
              className={cn(
                'tabular flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold',
                own ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {item.rank_absolute}
            </span>
            <span className={cn('min-w-0 flex-1 truncate text-sm', own && 'font-medium')}>{item.domain}</span>
            {own && <span className="text-xs font-medium text-primary">Your site</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function Vitals({ items }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-b-lg bg-border sm:grid-cols-3">
      {items.map((v) => (
        <div key={v.key} className="bg-card p-5">
          <p className="text-sm font-medium">{v.short}</p>
          <p className="text-xs text-muted-foreground">{v.label}</p>
          <p className="tabular mt-4 text-3xl font-semibold tracking-tight">{v.display}</p>
          <p className={cn('mt-2 flex items-center gap-1.5 text-sm font-medium', TONE[v.tone].text)}>
            <span className={cn('size-2 rounded-full', TONE[v.tone].dot)} />
            {TONE[v.tone].label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{v.target}</p>
        </div>
      ))}
    </div>
  );
}
