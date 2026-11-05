import Link from 'next/link';
import { FileSearch, Send } from 'lucide-react';
import { EmptyState } from '@/components/page-header';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export function StatStrip({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card p-5">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className={cn('tabular mt-2 text-2xl font-semibold tracking-tight', item.className)}>{item.value}</dd>
          {item.note && <p className="mt-1 text-xs leading-snug text-muted-foreground">{item.note}</p>}
        </div>
      ))}
    </dl>
  );
}

export function NumberedList({ items, tone = 'primary' }) {
  return (
    <ol className="divide-y">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4 px-5 py-4">
          <span
            className={cn(
              'tabular flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              tone === 'poor' ? 'bg-poor/10 text-poor' : 'bg-primary/10 text-primary',
            )}
          >
            {i + 1}
          </span>
          <p className="pt-0.5 leading-relaxed">{item}</p>
        </li>
      ))}
    </ol>
  );
}

export function PreviewPanel({ title, description, items, href, tone, empty }) {
  return (
    <section className="flex flex-col rounded-lg border bg-card">
      <header className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      {items.length ? (
        <NumberedList items={items.slice(0, 3)} tone={tone} />
      ) : (
        <p className="px-5 py-6 text-sm text-muted-foreground">{empty}</p>
      )}
      {items.length > 3 && (
        <Link
          href={href}
          className="mt-auto border-t px-5 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-secondary/50"
        >
          See all {items.length}
        </Link>
      )}
    </section>
  );
}

const CHANNELS = { whatsapp: 'WhatsApp', email: 'email' };

export function DeliveryNote({ audit, nextAudit }) {
  const sent = audit.notifications.filter((n) => n.status !== 'failed').map((n) => CHANNELS[n.channel] || n.channel);
  const date = formatDate(audit.completedAt || audit.createdAt, { month: 'long' });

  return (
    <p className="flex items-start gap-3 rounded-lg border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground">
      <Send className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>
        {sent.length ? `This report was sent to you on ${sent.join(' and ')} on ${date}.` : `This report was prepared on ${date}.`}{' '}
        Your next audit is due around {formatDate(nextAudit, { month: 'long' })}.
      </span>
    </p>
  );
}

export function NoReport({ running }) {
  if (running) return null;
  return (
    <EmptyState
      icon={FileSearch}
      title="Your first report is on its way"
      description="We audit your website every month. The report arrives on WhatsApp and email, and shows up here."
    />
  );
}
