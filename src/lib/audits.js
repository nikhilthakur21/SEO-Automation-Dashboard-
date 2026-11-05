const { randomUUID } = require('crypto');
const { Worker } = require('bullmq');
const { prisma } = require('./prisma');
const { auditQueue, QUEUE_NAME, createConnection } = require('./queue');

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

async function queueAudit(clientId, triggeredBy = 'manual') {
  const audit = await prisma.audit.create({ data: { clientId, triggeredBy } });
  try {
    await auditQueue.add('run-audit', { auditId: audit.id }, { jobId: audit.id });
  } catch (err) {
    await prisma.audit.update({
      where: { id: audit.id },
      data: { status: 'FAILED', currentStep: 'Failed', errorMessage: `Could not reach the job queue: ${err.message}` },
    });
    throw new Error('The job queue is unavailable. Check the Redis connection and try again.');
  }
  return audit;
}

// a client is due when it has had no audit of any kind in the last 30 days
async function queueDueAudits(limit = 5) {
  const cutoff = new Date(Date.now() - MONTH_MS);
  const due = await prisma.client.findMany({
    where: { audits: { none: { createdAt: { gte: cutoff } } } },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  const ids = [];
  for (const client of due) ids.push((await queueAudit(client.id, 'cron')).id);
  return ids;
}

// used by the cron route when no separate worker is deployed
async function processQueuedBatch({ limit = 1, budgetMs = 8000 } = {}) {
  const { runAudit, markFailed } = require('../worker/pipeline');
  const worker = new Worker(QUEUE_NAME, null, { connection: createConnection(), autorun: false });
  const token = randomUUID();
  const started = Date.now();
  const processed = [];

  try {
    while (processed.length < limit && Date.now() - started < budgetMs) {
      const job = await worker.getNextJob(token, { block: false });
      if (!job) break;
      const { auditId } = job.data;
      try {
        await runAudit(auditId);
        await job.moveToCompleted('done', token, false);
        processed.push({ auditId, status: 'COMPLETED' });
      } catch (err) {
        await markFailed(auditId, err, false);
        await job.moveToFailed(err, token, false);
        processed.push({ auditId, status: 'FAILED', error: err.message });
      }
    }
  } finally {
    await worker.close();
  }
  return processed;
}

module.exports = { queueAudit, queueDueAudits, processQueuedBatch };
