const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

function schemaTypeFor(businessType) {
  const type = businessType.toLowerCase();
  if (type.includes('dent')) return 'Dentist';
  if (type.includes('real')) return 'RealEstateAgent';
  if (/(health|clinic|hospital|doctor|medical)/.test(type)) return 'MedicalClinic';
  return 'LocalBusiness';
}

function buildMockAnalysis(client, signals) {
  const technical = signals.technical || {};
  const robots = signals.robots?.robots || {};
  const sitemap = signals.robots?.sitemap || {};
  const page = signals.onPage || {};
  const schema = signals.schema || {};
  const psi = signals.pagespeed;
  const gsc = signals.gsc;
  const rankings = signals.rankings;
  const city = client.city;
  const recs = [];

  const add = (priority, category, finding, fix, estimated_impact, effort, falsifiability_check) =>
    recs.push({ priority, category, finding, fix, estimated_impact, effort, falsifiability_check });

  let tech = 100;
  if (!technical.https) {
    tech -= 25;
    add('CRITICAL', 'Technical', 'The site is served over plain HTTP.',
      'Install an SSL certificate and 301-redirect every http:// URL to its https:// version.',
      'High', 'Hours', 'Requesting the http:// homepage returns a 301 to https:// and Chrome shows the padlock.');
  }
  if (robots.blocksAll || robots.blocksPage) {
    tech -= 35;
    add('CRITICAL', 'Technical', 'robots.txt blocks search engines from crawling this page.',
      'Remove the matching Disallow rule from robots.txt for User-agent: *.',
      'High', 'Hours', 'The Search Console robots.txt report shows the URL as allowed and it returns to the index within 2 weeks.');
  } else if (!robots.found) {
    tech -= 8;
    add('MEDIUM', 'Technical', 'There is no robots.txt file.',
      'Publish a robots.txt at the site root that allows crawling and lists the sitemap URL.',
      'Low', 'Hours', `${robots.url || '/robots.txt'} returns HTTP 200 with a Sitemap line.`);
  }
  if (!sitemap.found) {
    tech -= 12;
    add('HIGH', 'Technical', 'No XML sitemap was found.',
      'Generate sitemap.xml with every indexable page, reference it in robots.txt and submit it in Search Console.',
      'Medium', 'Hours', 'Search Console shows the sitemap as Success with all pages discovered.');
  } else if (!sitemap.includesPage) {
    tech -= 4;
    add('LOW', 'Technical', 'The audited page is missing from the XML sitemap.',
      'Add the homepage URL to sitemap.xml exactly as it appears in the canonical tag.',
      'Low', 'Hours', 'The page URL appears in sitemap.xml and in the Search Console sitemap report.');
  }
  if (page.robotsMeta && /noindex/i.test(page.robotsMeta)) {
    tech -= 35;
    add('CRITICAL', 'Technical', 'The page carries a noindex robots meta tag, so Google will drop it.',
      'Remove noindex from the robots meta tag (or the whole tag) on this page.',
      'High', 'Hours', 'URL Inspection in Search Console reports "Indexing allowed" and the page is indexed again.');
  }
  if (!page.canonical?.href) {
    tech -= 6;
    add('MEDIUM', 'Technical', 'The page has no canonical tag.',
      'Add <link rel="canonical"> pointing to the preferred https URL of the page.',
      'Low', 'Hours', 'View source shows a self-referencing canonical and URL Inspection reports the same Google-selected canonical.');
  }
  if (technical.responseTimeMs > 1500) {
    tech -= 8;
    add('MEDIUM', 'Technical', `The server took ${technical.responseTimeMs} ms to return the HTML.`,
      'Enable full-page caching or a CDN in front of the site and check slow database queries on the homepage.',
      'Medium', 'Days', 'Server response time stays under 600 ms across 10 consecutive requests.');
  }
  if (gsc?.indexCoverageErrors > 0) {
    tech -= gsc.indexCoverageErrors * 3;
    add('HIGH', 'Technical', `Search Console reports ${gsc.indexCoverageErrors} index coverage errors.`,
      'Open Pages > Why pages aren\'t indexed in Search Console, fix each error (404s, redirects, server errors) and click Validate fix.',
      'Medium', 'Days', 'The coverage error count in Search Console drops to 0 after validation completes.');
  }

  let onPage = 100;
  if (!page.title?.text) {
    onPage -= 25;
    add('CRITICAL', 'OnPage', 'The page has no title tag.',
      `Add a unique title such as "${client.businessType} in ${city} | ${client.name}".`,
      'High', 'Hours', 'Google shows the new title in results for a brand search within 2 weeks.');
  } else {
    if (page.title.length < 30 || page.title.length > 60) {
      onPage -= 8;
      add('MEDIUM', 'OnPage', `The title tag is ${page.title.length} characters long.`,
        'Rewrite the title to 50-60 characters with the main service and city first.',
        'Medium', 'Hours', 'The title is not truncated in a Google results preview and CTR in Search Console rises over 28 days.');
    }
    if (!page.title.city) {
      onPage -= 10;
      add('HIGH', 'OnPage', `The title does not mention ${city}, which weakens local relevance.`,
        `Put the service and "${city}" near the start of the title.`,
        'High', 'Hours', `Average position for "${client.businessType.toLowerCase()} ${city.toLowerCase()}" queries improves in Search Console over 4 weeks.`);
    }
  }
  if (!page.metaDescription?.text) {
    onPage -= 15;
    add('HIGH', 'OnPage', 'The meta description is missing, so Google picks a random snippet.',
      `Write a 140-155 character description with the service, ${city} and a call to action.`,
      'Medium', 'Hours', 'The new description shows in results and page CTR improves in Search Console over 28 days.');
  } else if (page.metaDescription.length < 70 || page.metaDescription.length > 160) {
    onPage -= 6;
    add('LOW', 'OnPage', `The meta description is ${page.metaDescription.length} characters long.`,
      'Rewrite it to 140-155 characters so it is neither cut off nor too thin.',
      'Low', 'Hours', 'The full description is visible in a Google results preview.');
  }
  if (page.headings?.h1Count === 0) {
    onPage -= 15;
    add('HIGH', 'OnPage', 'The page has no H1 heading.',
      `Add one H1 that states the main service and ${city}.`,
      'Medium', 'Hours', 'The rendered page has exactly one H1 when checked with a crawler.');
  } else if (page.headings?.h1Count > 1) {
    onPage -= 6;
    add('MEDIUM', 'OnPage', `The page has ${page.headings.h1Count} H1 headings.`,
      'Keep one H1 for the main topic and turn the others into H2s.',
      'Low', 'Hours', 'A crawl shows exactly one H1 on the page.');
  }
  if (page.images?.missingAlt > 0) {
    onPage -= Math.min(15, Math.ceil((page.images.missingAlt / page.images.total) * 30));
    add('MEDIUM', 'OnPage', `${page.images.missingAlt} of ${page.images.total} images have no alt text.`,
      'Add short descriptive alt text to each content image; use alt="" only for decorative ones.',
      'Low', 'Hours', 'A crawl reports 0 images without an alt attribute.');
  }
  if (!page.viewport) {
    onPage -= 20;
    add('CRITICAL', 'OnPage', 'The page has no viewport meta tag, so it renders poorly on phones.',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'High', 'Hours', 'Lighthouse mobile audit passes the viewport check.');
  }
  if (!page.lang) {
    onPage -= 4;
    add('LOW', 'OnPage', 'The html element has no lang attribute.',
      'Set <html lang="en-IN"> (or the correct language) on every page.',
      'Low', 'Hours', 'Lighthouse accessibility audit passes the html-has-lang check.');
  }
  if (page.openGraph && (!page.openGraph.title || !page.openGraph.image)) {
    onPage -= 5;
    add('LOW', 'OnPage', 'Open Graph tags are incomplete, so WhatsApp and social shares show no preview.',
      'Add og:title, og:description and a 1200x630 og:image.',
      'Low', 'Hours', 'Sharing the URL in WhatsApp shows a title and image preview.');
  }
  if (page.links && page.links.telLinks === 0) {
    onPage -= 6;
    add('MEDIUM', 'OnPage', 'There is no click-to-call phone link for mobile visitors.',
      'Wrap the clinic phone number in a tel: link in the header and contact section.',
      'Medium', 'Hours', 'Phone-call clicks appear in analytics or the Google Business Profile call report.');
  }

  let content = 100;
  const words = page.content?.wordCount ?? 0;
  if (words < 300) {
    content -= 30;
    add('HIGH', 'Content', `The page has only ${words} words of visible text.`,
      `Expand the page to 600+ words covering services, pricing ranges, doctors and FAQs for patients in ${city}.`,
      'High', 'Days', 'Impressions for service keywords grow in Search Console over 6 weeks.');
  } else if (words < 600) {
    content -= 12;
    add('MEDIUM', 'Content', `The page has ${words} words, which is thin for a competitive local keyword.`,
      'Add sections for each core service and a short FAQ answering common patient questions.',
      'Medium', 'Days', 'The page ranks for more long-tail queries in Search Console after 6 weeks.');
  }
  if ((page.headings?.h2Count ?? 0) < 2) {
    content -= 10;
    add('MEDIUM', 'Content', 'The page has fewer than two H2 subheadings.',
      'Break the content into H2 sections such as Services, Why choose us, Pricing and FAQs.',
      'Low', 'Hours', 'A crawl shows at least four H2 headings.');
  }
  if ((page.content?.cityMentions ?? 0) === 0) {
    content -= 20;
    add('HIGH', 'Content', `The visible text never mentions ${city}.`,
      `Mention ${city} and nearby areas naturally in the intro, services and contact sections, with the full address.`,
      'High', 'Hours', `The page starts appearing for "${city.toLowerCase()}" queries in Search Console within 4 weeks.`);
  }
  const internalLinks = page.links?.internal ?? 0;
  if (internalLinks < 5) {
    content -= 10;
    add('MEDIUM', 'Content', internalLinks
      ? `The page links to only ${internalLinks} other ${internalLinks === 1 ? 'page' : 'pages'} on the site.`
      : 'The page does not link to any other page on the site.',
      'Link to each service page, the contact page and the blog from the homepage.',
      'Medium', 'Hours', 'Search Console shows more internal links pointing to the service pages.');
  }
  const pageTwo = (gsc?.rows || []).filter((r) => r.position > 10).sort((a, b) => b.impressions - a.impressions)[0];
  if (pageTwo) {
    content -= 8;
    add('MEDIUM', 'Content', `"${pageTwo.query}" sits at position ${pageTwo.position} with ${pageTwo.impressions} impressions, just off page one.`,
      `Create a dedicated page for "${pageTwo.query}" with real price ranges, process and FAQs, and link to it from the homepage.`,
      'High', 'Days', `Average position for "${pageTwo.query}" moves inside the top 10 in Search Console within 8 weeks.`);
  }
  if (rankings?.client_rank_position > 3) {
    const keyword = rankings.tasks?.[0]?.result?.[0]?.keyword;
    content -= 6;
    add('MEDIUM', 'Content', `The site ranks #${rankings.client_rank_position} for "${keyword}" (${rankings.keyword_search_volume ?? 'unknown'} searches a month).`,
      'Strengthen the homepage for this keyword with local reviews, before-and-after cases and Google Business Profile links.',
      'High', 'Weeks', `DataForSEO reports a top-3 position for "${keyword}" within 3 months.`);
  }

  const audits = psi?.audits || {};
  const cwv = clamp((psi?.categories?.performance?.score ?? 0.5) * 100);
  const lcp = audits['largest-contentful-paint'];
  if (lcp && lcp.score < 0.5) {
    add('HIGH', 'CWV', `Largest Contentful Paint is ${lcp.displayValue} on mobile (target under 2.5 s).`,
      'Serve the hero image as WebP/AVIF at the right size, preload it, and lazy-load images below the fold.',
      'High', 'Days', 'PageSpeed Insights mobile LCP drops below 2.5 s and the CrUX report turns green.');
  }
  const inp = audits['interaction-to-next-paint'];
  if (inp && inp.score < 0.9) {
    add('MEDIUM', 'CWV', `Interaction to Next Paint is ${inp.displayValue} (target under 200 ms).`,
      'Break up long JavaScript tasks and delay third-party chat and analytics scripts until after load.',
      'Medium', 'Days', 'PageSpeed Insights reports INP under 200 ms for mobile.');
  }
  const unusedJs = audits['unused-javascript'];
  if (unusedJs && unusedJs.score < 0.5) {
    add('MEDIUM', 'CWV', `${unusedJs.displayValue} of JavaScript is downloaded but never used.`,
      'Remove unused plugins and code-split the bundle so each page loads only what it needs.',
      'Medium', 'Days', 'The unused-javascript audit in Lighthouse falls below 100 KiB.');
  }
  const blocking = audits['render-blocking-resources'];
  if (blocking && blocking.score <= 0.5) {
    add('MEDIUM', 'CWV', `${blocking.description || 'Render-blocking resources'} delay the first paint.`,
      'Add defer to non-critical scripts and inline the critical CSS for the first screen.',
      'Medium', 'Hours', 'Lighthouse no longer lists render-blocking resources.');
  }
  const lowCtr = (gsc?.rows || []).filter((r) => r.impressions >= 1000 && r.ctr < 0.04).sort((a, b) => b.impressions - a.impressions)[0];
  if (lowCtr) {
    add('HIGH', 'OnPage', `"${lowCtr.query}" gets ${lowCtr.impressions.toLocaleString('en-IN')} impressions but only ${(lowCtr.ctr * 100).toFixed(1)}% click through.`,
      'Rewrite the title and meta description around this query with a clear offer, such as same-day appointments.',
      'High', 'Hours', `CTR for "${lowCtr.query}" rises above 5% in Search Console over the next 28 days.`);
  }

  let schemaScore;
  const suggested = schemaTypeFor(client.businessType);
  if (!schema.found) {
    schemaScore = 15;
    add('HIGH', 'Schema', 'The page has no structured data.',
      `Add ${suggested} JSON-LD with name, address, telephone, geo, opening hours and url.`,
      'High', 'Hours', 'Google Rich Results Test detects a valid ' + suggested + ' item with no errors.');
  } else if (!schema.hasLocalBusiness) {
    schemaScore = 45;
    add('HIGH', 'Schema', `Structured data exists (${schema.types.join(', ')}) but there is no local business markup.`,
      `Add a ${suggested} JSON-LD block with the full NAP details and opening hours.`,
      'High', 'Hours', `Rich Results Test shows a ${suggested} item and the knowledge panel details match the site.`);
  } else {
    const local = schema.entities.find((e) => e.isLocalBusiness) || { missingRequired: [], missingRecommended: [] };
    schemaScore = clamp(100 - local.missingRequired.length * 15 - local.missingRecommended.length * 5);
    if (local.missingRequired.length || local.missingRecommended.length) {
      const missing = [...local.missingRequired, ...local.missingRecommended];
      add(local.missingRequired.length ? 'HIGH' : 'LOW', 'Schema', `The ${local.type} markup is missing: ${missing.join(', ')}.`,
        `Add ${missing.join(', ')} to the existing JSON-LD block.`,
        'Medium', 'Hours', 'Rich Results Test shows no warnings for the local business item.');
    }
  }
  if (schema.errors?.length) {
    schemaScore = clamp(schemaScore - 15);
    add('HIGH', 'Schema', `${schema.errors.length} JSON-LD block(s) contain invalid JSON and are ignored by Google.`,
      'Fix the syntax errors (trailing commas, unescaped quotes) and re-test the markup.',
      'Medium', 'Hours', 'Schema Markup Validator parses every JSON-LD block without errors.');
  }

  const breakdown = {
    technical: clamp(tech),
    on_page: clamp(onPage),
    content: clamp(content),
    core_web_vitals: cwv,
    schema: clamp(schemaScore),
  };
  const overall = clamp(
    breakdown.technical * 0.25 + breakdown.on_page * 0.2 + breakdown.content * 0.15
    + breakdown.core_web_vitals * 0.25 + breakdown.schema * 0.15,
  );

  recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const critical = recs.filter((r) => r.priority === 'CRITICAL');
  const high = recs.filter((r) => r.priority === 'HIGH');
  const labels = { technical: 'technical health', on_page: 'on-page SEO', content: 'content', core_web_vitals: 'page speed', schema: 'structured data' };
  const [weakestKey, weakestScore] = Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0];

  return {
    audit_version: 'v1.0',
    overall_score: overall,
    score_breakdown: breakdown,
    critical_issues: critical.slice(0, 5).map((r) => r.finding),
    important_issues: recs.filter((r) => r.priority === 'HIGH' || r.priority === 'MEDIUM').slice(0, 8).map((r) => r.finding),
    quick_wins: recs.filter((r) => r.effort === 'Hours' && r.priority !== 'CRITICAL').slice(0, 5).map((r) => r.fix),
    recommendations: recs,
    executive_summary: [
      `${client.name} scores ${overall}/100, with ${labels[weakestKey]} the weakest area at ${weakestScore}/100.`,
      critical.length
        ? `${critical.length} critical ${critical.length === 1 ? 'issue needs' : 'issues need'} fixing before anything else.`
        : `Nothing is blocking indexing, but ${high.length} high-priority ${high.length === 1 ? 'fix is' : 'fixes are'} holding the score back.`,
      'The quick wins below take a few hours each and are the fastest way to lift local rankings.',
    ].join(' '),
  };
}

module.exports = { buildMockAnalysis };
