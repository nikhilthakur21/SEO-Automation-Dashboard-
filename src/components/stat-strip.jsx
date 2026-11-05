import { cn } from '@/lib/utils';

export function StatStrip({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1 lg:grid-cols-4">
      {items.map(({ label, value, suffix, note, className }) => (
        <div key={label} className="flex flex-col rounded-lg bg-card p-5 shadow-sm">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className={cn('tabular mt-2 text-3xl font-semibold tracking-tight', className)}>
            {value}
            {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
          </dd>
          {note && <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{note}</p>}
        </div>
      ))}
    </dl>
  );
}
