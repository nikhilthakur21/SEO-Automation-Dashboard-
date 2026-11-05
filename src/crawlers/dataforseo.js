const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/dataforseo.mock');

async function getRankings({ domain, keyword, city, state }) {
  if (USE_MOCKS) return mockData;

  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
    body: JSON.stringify([{ keyword, location_name: `${city},${state},India`, language_code: 'en', depth: 20 }]),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`DataForSEO returned HTTP ${res.status}`);
  const data = await res.json();

  const result = data.tasks?.[0]?.result?.[0];
  const items = (result?.items || [])
    .filter((i) => i.type === 'organic')
    .map(({ type, rank_group, rank_absolute, domain: d }) => ({ type, rank_group, rank_absolute, domain: d }));
  const own = items.find((i) => i.domain?.replace(/^www\./, '') === domain.replace(/^www\./, ''));

  return {
    tasks: [{ result: [{ keyword, items }] }],
    client_rank_position: own ? own.rank_absolute : null,
    keyword_search_volume: null,
  };
}

module.exports = { getRankings };
