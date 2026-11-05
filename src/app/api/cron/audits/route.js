import { NextResponse } from 'next/server';
import { queueDueAudits, processQueuedBatch } from '@/lib/audits';
import { pingStorage } from '@/lib/storage';
import { pingWorker } from '@/lib/worker-status';

export const dynamic = 'force-dynamic';

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return req.headers.get('x-cron-secret') === secret || bearer === secret;
}

export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const queued = await queueDueAudits(Number(process.env.CRON_ENQUEUE_LIMIT || 5));

  let worker;
  let processed = [];
  if (process.env.WORKER_URL) {
    // the ping also wakes a free-tier worker that has gone to sleep
    worker = await pingWorker();
  } else {
    worker = 'inline';
    processed = await processQueuedBatch({ limit: Number(process.env.CRON_BATCH_SIZE || 1) });
  }

  // touching storage once an hour keeps the Supabase project from pausing
  if (new Date().getUTCMinutes() === 0) await pingStorage().catch(() => {});

  return NextResponse.json({ ok: true, queued, processed, worker });
}
