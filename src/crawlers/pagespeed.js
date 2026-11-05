const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/pagespeed.mock');

const AUDIT_KEYS = [
  'largest-contentful-paint',
  'cumulative-layout-shift',
  'interaction-to-next-paint',
  'render-blocking-resources',
  'unused-javascript',
];

async function getPageSpeed(url) {
  if (USE_MOCKS) return mockData;

  const params = new URLSearchParams({ url, strategy: 'mobile' });
  ['performance', 'seo', 'accessibility'].forEach((c) => params.append('category', c));
  if (process.env.PAGESPEED_API_KEY) params.set('key', process.env.PAGESPEED_API_KEY);

  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`PageSpeed Insights returned HTTP ${res.status}`);
  const { lighthouseResult: lh } = await res.json();

  const audits = {};
  for (const key of AUDIT_KEYS) {
    const audit = lh.audits[key];
    if (audit) audits[key] = { score: audit.score, displayValue: audit.displayValue, description: audit.title };
  }

  return {
    url,
    strategy: 'mobile',
    categories: {
      performance: { score: lh.categories.performance?.score ?? null },
      seo: { score: lh.categories.seo?.score ?? null },
      accessibility: { score: lh.categories.accessibility?.score ?? null },
    },
    audits,
  };
}

module.exports = { getPageSpeed };
