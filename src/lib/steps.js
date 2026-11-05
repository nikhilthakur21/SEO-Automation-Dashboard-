const STEPS = [
  { key: 'crawl', label: 'Crawling the page', progress: 8 },
  { key: 'pagespeed', label: 'Checking PageSpeed Insights', progress: 16 },
  { key: 'gsc', label: 'Reading Search Console data', progress: 24 },
  { key: 'schema', label: 'Validating Schema.org markup', progress: 32 },
  { key: 'onpage', label: 'Analysing on-page SEO', progress: 40 },
  { key: 'robots', label: 'Checking robots.txt and sitemap', progress: 48 },
  { key: 'rankings', label: 'Fetching keyword rankings', progress: 56 },
  { key: 'analysis', label: 'Analysing signals with Claude', progress: 64 },
  { key: 'save', label: 'Saving results to the database', progress: 82 },
  { key: 'pdf', label: 'Generating the PDF report', progress: 88 },
  { key: 'notify', label: 'Sending WhatsApp and email', progress: 95 },
];

module.exports = { STEPS };
