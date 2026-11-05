const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const QUEUE_NAME = 'seo-audit-jobs';

// workers must retry forever; the web app should fail fast so requests never hang
function createConnection({ failFast = false } = {}) {
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL is not set');
  return new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: failFast ? 2 : null,
    enableReadyCheck: false,
    connectTimeout: 5000,
  });
}

function getQueue() {
  if (!globalThis.seoAuditQueue) {
    globalThis.seoAuditQueue = new Queue(QUEUE_NAME, {
      connection: createConnection({ failFast: true }),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 15000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    });
  }
  return globalThis.seoAuditQueue;
}

// created lazily so importing this file never opens a Redis connection
const auditQueue = {
  add: (name, data, opts) => getQueue().add(name, data, opts),
  getJobCounts: (...types) => getQueue().getJobCounts(...types),
};

module.exports = { QUEUE_NAME, auditQueue, createConnection };
