const cheerio = require('cheerio');

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function keywordTerms(businessType) {
  return businessType
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4);
}

function analyseOnPage(html, pageUrl, client) {
  const $ = cheerio.load(html);
  const page = new URL(pageUrl);
  const city = client.city.toLowerCase();
  const terms = keywordTerms(client.businessType);
  const mentions = (text) => ({
    city: text.toLowerCase().includes(city),
    keyword: terms.some((t) => text.toLowerCase().includes(t)),
  });

  const title = clean($('title').first().text());
  const description = clean($('meta[name="description"]').attr('content'));
  const h1 = $('h1').map((_, el) => clean($(el).text())).get();

  const images = $('img');
  const missingAlt = images.filter((_, el) => $(el).attr('alt') === undefined).length;

  let internal = 0;
  let external = 0;
  let telLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href').trim();
    if (href.startsWith('tel:')) telLinks += 1;
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return;
    try {
      new URL(href, page).host === page.host ? (internal += 1) : (external += 1);
    } catch {
      // ignore malformed hrefs
    }
  });

  $('script, style, noscript, svg, template').remove();
  const bodyText = clean($('body').text());
  const wordCount = bodyText ? bodyText.split(' ').length : 0;
  const cityMentions = bodyText.toLowerCase().split(city).length - 1;

  const canonical = $('link[rel="canonical"]').attr('href') || null;
  let canonicalUrl = null;
  try {
    canonicalUrl = canonical ? new URL(canonical, page).href : null;
  } catch {
    canonicalUrl = canonical;
  }

  const data = {
    title: { text: title, length: title.length, ...mentions(title) },
    metaDescription: { text: description, length: description.length },
    headings: {
      h1,
      h1Count: h1.length,
      h2Count: $('h2').length,
      h3Count: $('h3').length,
      h1Mentions: mentions(h1.join(' ')),
    },
    images: { total: images.length, missingAlt },
    links: { internal, external, telLinks },
    content: { wordCount, cityMentions },
    canonical: { href: canonicalUrl, selfReferencing: canonicalUrl?.replace(/\/$/, '') === page.href.replace(/\/$/, '') },
    robotsMeta: $('meta[name="robots"]').attr('content') || null,
    viewport: $('meta[name="viewport"]').attr('content') || null,
    lang: $('html').attr('lang') || null,
    openGraph: {
      title: Boolean($('meta[property="og:title"]').attr('content')),
      description: Boolean($('meta[property="og:description"]').attr('content')),
      image: Boolean($('meta[property="og:image"]').attr('content')),
    },
    twitterCard: $('meta[name="twitter:card"]').attr('content') || null,
    hreflangCount: $('link[rel="alternate"][hreflang]').length,
  };

  data.issues = findIssues(data, client);
  return data;
}

function findIssues(d, client) {
  const issues = [];
  if (!d.title.text) issues.push('Page has no title tag');
  else if (d.title.length < 30 || d.title.length > 60) issues.push(`Title is ${d.title.length} characters (aim for 30-60)`);
  if (d.title.text && !d.title.city) issues.push(`Title does not mention ${client.city}`);
  if (!d.metaDescription.text) issues.push('Meta description is missing');
  else if (d.metaDescription.length < 70 || d.metaDescription.length > 160) {
    issues.push(`Meta description is ${d.metaDescription.length} characters (aim for 70-160)`);
  }
  if (d.headings.h1Count === 0) issues.push('Page has no H1 heading');
  if (d.headings.h1Count > 1) issues.push(`Page has ${d.headings.h1Count} H1 headings`);
  if (d.images.missingAlt > 0) issues.push(`${d.images.missingAlt} of ${d.images.total} images have no alt text`);
  if (!d.canonical.href) issues.push('No canonical tag');
  if (!d.viewport) issues.push('No viewport meta tag');
  if (!d.lang) issues.push('The html element has no lang attribute');
  if (d.content.wordCount < 300) issues.push(`Only ${d.content.wordCount} words of visible text`);
  if (d.robotsMeta && /noindex/i.test(d.robotsMeta)) issues.push('Robots meta tag blocks indexing');
  if (!d.openGraph.title || !d.openGraph.image) issues.push('Open Graph tags are incomplete');
  if (d.links.telLinks === 0) issues.push('No click-to-call phone link');
  return issues;
}

module.exports = { analyseOnPage };
