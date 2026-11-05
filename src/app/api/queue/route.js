import { NextResponse } from 'next/server';
import { auditQueue, QUEUE_NAME } from '@/lib/queue';
import { getSession } from '@/lib/auth';
import { pingWorker } from '@/lib/worker-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [counts, worker] = await Promise.all([
      auditQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      pingWorker(2000),
    ]);
    return NextResponse.json({ queue: QUEUE_NAME, counts, worker }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: `Queue unavailable: ${err.message}` }, { status: 503 });
  }
}
