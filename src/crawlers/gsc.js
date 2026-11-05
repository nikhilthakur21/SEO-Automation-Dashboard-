const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/gsc.mock');

function isoDate(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

async function getSearchConsole(siteUrl) {
  if (USE_MOCKS) return mockData;

  const site = encodeURIComponent(siteUrl);
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.GSC_ACCESS_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ startDate: isoDate(28), endDate: isoDate(1), dimensions: ['query'], rowLimit: 10 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Search Console returned HTTP ${res.status}`);
  const data = await res.json();

  const rows = (data.rows || []).map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Number(r.ctr.toFixed(3)),
    position: Number(r.position.toFixed(1)),
  }));

  return {
    rows,
    totalClicks: rows.reduce((sum, r) => sum + r.clicks, 0),
    totalImpressions: rows.reduce((sum, r) => sum + r.impressions, 0),
    // coverage errors come from the URL Inspection API, not search analytics
    indexCoverageErrors: null,
  };
}

module.exports = { getSearchConsole };
