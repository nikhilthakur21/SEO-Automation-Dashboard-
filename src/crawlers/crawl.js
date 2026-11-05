const { get, describeFetchError } = require('./http');

async function crawlPage(url) {
  const started = Date.now();
  let res;
  try {
    res = await get(url, { headers: { accept: 'text/html,application/xhtml+xml' } });
  } catch (err) {
    throw new Error(`Could not reach ${url} (${describeFetchError(err)})`);
  }

  const html = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`);
  if (!contentType.includes('html')) throw new Error(`${url} did not return an HTML page (${contentType || 'no content type'})`);

  return {
    html,
    technical: {
      requestedUrl: url,
      finalUrl: res.url,
      statusCode: res.status,
      redirected: res.redirected,
      https: res.url.startsWith('https://'),
      responseTimeMs: Date.now() - started,
      htmlBytes: Buffer.byteLength(html),
      contentType,
      compression: res.headers.get('content-encoding'),
      cacheControl: res.headers.get('cache-control'),
      xRobotsTag: res.headers.get('x-robots-tag'),
    },
  };
}

module.exports = { crawlPage };
