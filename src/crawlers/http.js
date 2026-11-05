const USER_AGENT = 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)';

async function get(url, { timeout = 15000, headers = {} } = {}) {
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
    headers: { 'user-agent': USER_AGENT, accept: '*/*', ...headers },
  });
}

function describeFetchError(err) {
  if (err.name === 'TimeoutError') return 'the request timed out';
  return err.cause?.code || err.message;
}

module.exports = { get, describeFetchError, USER_AGENT };
