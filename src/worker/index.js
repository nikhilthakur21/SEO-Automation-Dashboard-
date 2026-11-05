const http = require('http');
const { Worker } = require('bullmq');
const { QUEUE_NAME, createConnection } = require('../lib/queue');
const { USE_MOCKS } = require('../mocks');
const { runAudit, markFailed } = require('./pipeline');

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { auditId } = job.data;
    console.log(`[worker] picked up job ${job.id} (audit ${auditId}, attempt ${job.attemptsMade + 1})`);
    try {
      await runAudit(auditId);
    } catch (err) {
      const willRetry = job.attemptsMade + 1 < (job.opts.attempts || 1);
      await markFailed(auditId, err, willRetry);
      throw err;
    }
  },
  {
    connection: createConnection(),
    concurrency: Number(process.env.WORKER_CONCURRENCY || 1),
    // long idle polls and slower stall checks keep Upstash usage well inside the free tier
    drainDelay: 60,
    stalledInterval: 5 * 60 * 1000,
    lockDuration: 2 * 60 * 1000,
  },
);

worker.on('completed', (job) => console.log(`[worker] job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[worker] job ${job?.id} failed: ${err.message}`));
worker.on('error', (err) => console.error(`[worker] ${err.message}`));

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, queue: QUEUE_NAME, running: worker.isRunning(), mocks: USE_MOCKS }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`[worker] listening on ${QUEUE_NAME}, health check on :${port}/health, mocks ${USE_MOCKS ? 'on' : 'off'}`);
});

async function shutdown() {
  console.log('[worker] shutting down');
  server.close();
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
