const cheerio = require('cheerio');
const { get, describeFetchError } = require('./http');

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const field = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();

    if (field === 'sitemap') sitemaps.push(value);
    else if (field === 'user-agent') {
      if (!current || current.rules.length) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
    } else if (current && (field === 'disallow' || field === 'allow')) {
      current.rules.push({ type: field, path: value });
    }
  }

  const general = groups.find((g) => g.agents.includes('*'));
  const disallow = general ? general.rules.filter((r) => r.type === 'disallow' && r.path).map((r) => r.path) : [];
  return { disallow, sitemaps };
}

async function checkRobots(origin, pagePath) {
  const robots = { url: `${origin}/robots.txt`, found: false, status: null, blocksAll: false, blocksPage: false, disallow: [], sitemaps: [] };
  try {
    const res = await get(robots.url, { timeout: 10000 });
    robots.status = res.status;
    if (res.ok) {
      const { disallow, sitemaps } = parseRobots(await res.text());
      robots.found = true;
      robots.disallow = disallow.slice(0, 20);
      robots.sitemaps = sitemaps;
      robots.blocksAll = disallow.includes('/');
      robots.blocksPage = disallow.some((rule) => pagePath.startsWith(rule.replace(/\*.*$/, '')));
    }
  } catch (err) {
    robots.error = describeFetchError(err);
  }
  return robots;
}

async function checkSitemap(sitemapUrl, pageUrl) {
  const sitemap = { url: sitemapUrl, found: false, status: null, type: null, urlCount: 0, includesPage: false };
  try {
    const res = await get(sitemapUrl, { timeout: 15000 });
    sitemap.status = res.status;
    if (!res.ok) return sitemap;

    const $ = cheerio.load(await res.text(), { xmlMode: true });
    const urls = $('urlset > url > loc').map((_, el) => $(el).text().trim()).get();
    const children = $('sitemapindex > sitemap > loc').length;
    const normalize = (u) => u.replace(/\/$/, '');

    sitemap.found = urls.length > 0 || children > 0;
    sitemap.type = children > 0 ? 'index' : 'urlset';
    sitemap.urlCount = children > 0 ? children : urls.length;
    sitemap.includesPage = urls.some((u) => normalize(u) === normalize(pageUrl));
  } catch (err) {
    sitemap.error = describeFetchError(err);
  }
  return sitemap;
}

async function checkRobotsAndSitemap(pageUrl) {
  const { origin, pathname } = new URL(pageUrl);
  const robots = await checkRobots(origin, pathname);
  const sitemap = await checkSitemap(robots.sitemaps[0] || `${origin}/sitemap.xml`, pageUrl);
  return { robots, sitemap };
}

module.exports = { checkRobotsAndSitemap };
