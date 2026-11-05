import { ScoreBreakdown, ScoreScale } from '@/components/score';
import { RecommendationList } from '@/components/recommendation-list';

function IssueList({ title, description, items, empty, marker }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      {items.length ? (
        <ul className="divide-y">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 px-5 py-3 text-sm leading-relaxed">
              <span className={`mt-2 size-1.5 shrink-0 rounded-full ${marker}`} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

export function ScoreHero({ result, caption }) {
  return (
    <section className="rounded-lg border bg-card p-5 sm:p-6">
      {caption && <p className="mb-4 text-sm text-muted-foreground">{caption}</p>}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <ScoreScale score={result.overall_score} />
        <ScoreBreakdown breakdown={result.score_breakdown} className="-my-2.5" />
      </div>
      <p className="mt-8 max-w-3xl border-t pt-5 text-[15px] leading-relaxed">{result.executive_summary}</p>
    </section>
  );
}

export function AuditReport({ result }) {
  return (
    <div className="space-y-6">
      <ScoreHero result={result} />

      <div className="grid gap-6 lg:grid-cols-2">
        <IssueList
          title="Fix first"
          description="Problems that hold the whole site back."
          items={result.critical_issues}
          empty="No critical issues this month."
          marker="bg-poor"
        />
        <IssueList
          title="Quick wins"
          description="Each takes about two hours or less."
          items={result.quick_wins}
          empty="No quick wins this month."
          marker="bg-primary"
        />
      </div>

      <RecommendationList recommendations={result.recommendations} />
    </div>
  );
}
