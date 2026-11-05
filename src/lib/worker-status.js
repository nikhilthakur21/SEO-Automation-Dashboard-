async function pingWorker(timeout = 3000) {
  if (!process.env.WORKER_URL) return 'inline';
  try {
    const res = await fetch(`${process.env.WORKER_URL.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store',
    });
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

module.exports = { pingWorker };
