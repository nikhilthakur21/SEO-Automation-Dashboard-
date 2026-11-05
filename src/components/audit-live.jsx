'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Circle, CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { STEPS } from '@/lib/steps';

function stepState(index, currentIndex, status) {
  if (status === 'COMPLETED' || index < currentIndex) return 'done';
  if (index === currentIndex) return status === 'FAILED' ? 'failed' : 'current';
  return 'pending';
}

export function AuditLive({ auditId, initial, compact = false }) {
  const router = useRouter();
  const [audit, setAudit] = useState(initial);
  const finished = audit.status === 'COMPLETED' || audit.status === 'FAILED';
  const announced = useRef(finished);

  useEffect(() => {
    if (finished) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}`, { cache: 'no-store' });
        if (res.ok && !cancelled) setAudit(await res.json());
      } catch {
        // keep polling through brief network drops
      }
    };
    const id = setInterval(tick, 1500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [auditId, finished]);

  useEffect(() => {
    if (!finished || announced.current) return;
    announced.current = true;
    if (audit.status === 'COMPLETED') toast.success('Audit completed', { description: `Overall score ${audit.overallScore}/100` });
    else toast.error('Audit failed', { description: audit.errorMessage });
    router.refresh();
  }, [finished, audit, router]);

  const currentIndex = STEPS.findIndex((s) => s.label === audit.currentStep);
  const progress = audit.status === 'COMPLETED' ? 100 : audit.progress;
  const headline =
    audit.status === 'QUEUED'
      ? audit.currentStep || 'Waiting in the queue for a worker'
      : audit.status === 'FAILED'
        ? 'The audit stopped with an error'
        : audit.currentStep || 'Starting';

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium">{headline}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {compact
                ? 'A new report is being prepared. It usually takes about a minute.'
                : audit.status === 'QUEUED'
                  ? 'Job added to seo-audit-jobs. The worker picks it up within a few seconds.'
                  : 'This page updates on its own while the worker runs.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="tabular text-sm font-semibold">{progress}%</span>
            <StatusBadge status={audit.status} />
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
        {audit.status === 'FAILED' && audit.errorMessage && (
          <p className="flex items-start gap-2 rounded-md bg-poor/10 px-3 py-2 text-sm text-poor">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {audit.errorMessage}
          </p>
        )}
      </div>
      {!compact && (
        <ol className="grid border-t px-5 py-4 sm:grid-cols-2 sm:gap-x-8">
          {STEPS.map((step, index) => {
            const state = stepState(index, currentIndex, audit.status);
            return (
              <li key={step.key} className="flex items-center gap-2.5 py-1.5 text-sm">
                {state === 'done' && <Check className="size-4 text-good" />}
                {state === 'current' && <LoaderCircle className="size-4 animate-spin text-primary" />}
                {state === 'failed' && <CircleAlert className="size-4 text-poor" />}
                {state === 'pending' && <Circle className="size-4 text-muted-foreground/40" />}
                <span className={cn(state === 'pending' && 'text-muted-foreground', state === 'current' && 'font-medium')}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
