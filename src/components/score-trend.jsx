'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { scoreTone, VERDICTS } from '@/lib/score';

const config = { score: { label: 'Overall score', color: 'hsl(var(--primary))' } };

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{point.full}</p>
      <p className="mt-0.5">
        <span className="tabular font-semibold">{point.score}</span>
        <span className="text-muted-foreground"> / 100, {VERDICTS[scoreTone(point.score)].toLowerCase()}</span>
      </p>
    </div>
  );
}

export function ScoreTrend({ points }) {
  if (points.length < 2) {
    return (
      <p className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        The trend appears after the second completed audit.
      </p>
    );
  }

  const data = points.map((p) => {
    const d = new Date(p.date);
    return {
      score: p.score,
      short: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      full: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  });

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} strokeDasharray="0" className="stroke-border/60" />
        <XAxis dataKey="short" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 90, 100]} tickLine={false} axisLine={false} width={40} />
        <ReferenceLine y={50} strokeDasharray="4 4" className="stroke-muted-foreground/40" />
        <ReferenceLine y={90} strokeDasharray="4 4" className="stroke-muted-foreground/40" />
        <ChartTooltip cursor={{ strokeWidth: 1 }} content={<TrendTooltip />} />
        <Line
          dataKey="score"
          type="monotone"
          stroke="var(--color-score)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-score)', stroke: 'hsl(var(--card))' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
