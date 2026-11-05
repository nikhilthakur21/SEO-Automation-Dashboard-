const fs = require('fs');
const path = require('path');
const { scoreTone, VERDICTS, CATEGORY_LABELS, PRIORITY_LABELS, RECOMMENDATION_CATEGORIES } = require('./score');

const TONES = { good: '#188A4C', warn: '#C27A0E', poor: '#C93A3A', none: '#5B6577' };

let fontCss;
function fonts() {
  if (fontCss) return fontCss;
  const dir = path.join(path.dirname(require.resolve('@fontsource/ibm-plex-sans')), 'files');
  fontCss = [400, 500, 600]
    .map((weight) => {
      const data = fs.readFileSync(path.join(dir, `ibm-plex-sans-latin-${weight}-normal.woff2`)).toString('base64');
      return `@font-face{font-family:'Plex';font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`;
    })
    .join('');
  return fontCss;
}

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const yesNo = (v) => (v ? 'Yes' : 'No');

function scale(score) {
  const tone = scoreTone(score);
  const zone = (name, width) =>
    `<div class="zone" style="width:${width}%;background:${TONES[name]};opacity:${tone === name ? 0.9 : 0.18}"></div>`;
  return `
    <div class="scale">
      ${zone('poor', 50)}${zone('warn', 40)}${zone('good', 10)}
      <div class="marker" style="left:${score}%"></div>
    </div>
    <div class="ticks"><span>0</span><span style="left:50%">50</span><span style="left:90%">90</span></div>`;
}

function breakdownRows(breakdown) {
  return Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => {
      const value = breakdown[key];
      return `<div class="row">
        <span class="label">${label}</span>
        <span class="bar"><span style="width:${value}%;background:${TONES[scoreTone(value)]}"></span></span>
        <span class="value">${value}</span>
      </div>`;
    })
    .join('');
}

function list(items, empty) {
  if (!items.length) return `<p class="muted">${empty}</p>`;
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function recommendationRows(recs) {
  return recs
    .map(
      (r) => `<tr>
        <td><span class="pill ${r.priority.toLowerCase()}">${PRIORITY_LABELS[r.priority]}</span><div class="cat">${RECOMMENDATION_CATEGORIES[r.category] || r.category}</div></td>
        <td><p class="finding">${esc(r.finding)}</p><p>${esc(r.fix)}</p></td>
        <td class="nowrap">${esc(r.estimated_impact)} impact<br><span class="muted">${esc(r.effort)}</span></td>
        <td>${esc(r.falsifiability_check)}</td>
      </tr>`,
    )
    .join('');
}

function signalTables(signals) {
  const psi = signals.pagespeed || {};
  const audits = psi.audits || {};
  const gsc = signals.gsc || {};
  const ranking = signals.rankings?.tasks?.[0]?.result?.[0];
  const ownRank = signals.rankings?.client_rank_position;
  const robots = signals.robots?.robots || {};
  const sitemap = signals.robots?.sitemap || {};
  const t = signals.technical || {};
  const metric = (key, label) =>
    audits[key] ? `<tr><td>${label}</td><td>${esc(audits[key].displayValue || audits[key].description || '-')}</td></tr>` : '';

  return `
    <div class="cols">
      <div>
        <h3>Core Web Vitals (mobile)</h3>
        <table class="data">
          <tr><td>Performance score</td><td>${Math.round((psi.categories?.performance?.score ?? 0) * 100)}</td></tr>
          ${metric('largest-contentful-paint', 'Largest Contentful Paint')}
          ${metric('cumulative-layout-shift', 'Cumulative Layout Shift')}
          ${metric('interaction-to-next-paint', 'Interaction to Next Paint')}
          ${metric('render-blocking-resources', 'Render-blocking resources')}
          ${metric('unused-javascript', 'Unused JavaScript')}
        </table>
      </div>
      <div>
        <h3>Technical checks</h3>
        <table class="data">
          <tr><td>HTTPS</td><td>${yesNo(t.https)}</td></tr>
          <tr><td>HTTP status</td><td>${esc(t.statusCode)}</td></tr>
          <tr><td>Server response</td><td>${esc(t.responseTimeMs)} ms</td></tr>
          <tr><td>robots.txt</td><td>${robots.found ? 'Found' : 'Missing'}</td></tr>
          <tr><td>XML sitemap</td><td>${sitemap.found ? `${sitemap.urlCount} URLs` : 'Missing'}</td></tr>
          <tr><td>Index coverage errors</td><td>${gsc.indexCoverageErrors ?? '-'}</td></tr>
        </table>
      </div>
    </div>
    <h3>Search Console, last 28 days</h3>
    <table class="data wide">
      <thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
      <tbody>${(gsc.rows || [])
        .map((r) => `<tr><td>${esc(r.query)}</td><td>${r.clicks}</td><td>${r.impressions}</td><td>${pct(r.ctr)}</td><td>${r.position}</td></tr>`)
        .join('')}</tbody>
    </table>
    ${ranking ? `<h3>Google ranking for "${esc(ranking.keyword)}"</h3>
    <table class="data wide">
      <thead><tr><th>Domain</th><th>Position</th></tr></thead>
      <tbody>${ranking.items
        .map((i) => `<tr class="${i.rank_absolute === ownRank ? 'own' : ''}"><td>${esc(i.domain)}</td><td>${i.rank_absolute}</td></tr>`)
        .join('')}</tbody>
    </table>` : ''}`;
}

function renderReportHtml({ client, audit, result, signals }) {
  const score = result.overall_score;
  const tone = scoreTone(score);
  const date = new Date(audit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const meta = signals.meta || {};
  const analysedBy = meta.fallbackReason
    ? 'the built-in analysis, because Claude was unavailable'
    : meta.analysedBy === 'mock'
      ? 'mock analysis (USE_MOCKS)'
      : meta.analysedBy;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
${fonts()}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plex',sans-serif;color:#1B2333;font-size:9.5pt;line-height:1.5;-webkit-print-color-adjust:exact}
.muted{color:#5B6577}
header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12px;border-bottom:1.5px solid #1B2333}
header h1{font-size:22pt;font-weight:600;line-height:1.15;letter-spacing:-0.01em}
header .sub{color:#5B6577;margin-top:4px}
header .meta{text-align:right;color:#5B6577;font-size:8.5pt}
.score{display:grid;grid-template-columns:62mm 1fr;gap:12mm;margin-top:9mm;align-items:start}
.big{font-size:54pt;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
.big small{font-size:13pt;font-weight:400;color:#5B6577}
.verdict{font-weight:600;font-size:11pt;margin-top:6px;color:${TONES[tone]}}
.scale{position:relative;display:flex;gap:2px;height:9px;margin-top:14px}
.zone{height:9px;border-radius:2px}
.marker{position:absolute;top:-5px;width:3px;height:19px;margin-left:-1.5px;background:#1B2333;border-radius:2px}
.ticks{position:relative;height:14px;margin-top:4px;font-size:7.5pt;color:#5B6577}
.ticks span{position:absolute}
.ticks span:first-child{left:0}
.ticks span:nth-child(2),.ticks span:nth-child(3){transform:translateX(-50%)}
.row{display:grid;grid-template-columns:30mm 1fr 10mm;gap:4mm;align-items:center;padding:5px 0;border-bottom:1px solid #E2E5EB}
.row .bar{height:6px;background:#EEF0F3;border-radius:3px;overflow:hidden}
.row .bar span{display:block;height:100%;border-radius:3px}
.row .value{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
h2{font-size:12.5pt;font-weight:600;margin:8mm 0 2.5mm}
h3{font-size:10pt;font-weight:600;margin:6mm 0 2mm}
.summary{font-size:10.5pt;max-width:160mm}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:9mm}
ul{list-style:none}
li{position:relative;padding:5px 0 5px 13px;border-bottom:1px solid #E2E5EB}
li:before{content:'';position:absolute;left:0;top:11px;width:6px;height:6px;border-radius:50%}
.critical li:before{background:#C93A3A}
.wins li:before{background:#2340D8}
.important li:before{background:#C27A0E}
.own td{font-weight:600}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-weight:500;color:#5B6577;font-size:8pt;padding:5px 6px;border-bottom:1px solid #1B2333}
td{padding:7px 6px;border-bottom:1px solid #E2E5EB;vertical-align:top}
tr{page-break-inside:avoid}
.recs td p+p{margin-top:3px;color:#3A4456}
.finding{font-weight:500}
.cat{font-size:7.5pt;color:#5B6577;margin-top:4px}
.nowrap{white-space:nowrap}
.pill{display:inline-block;font-size:7.5pt;font-weight:600;padding:1px 6px;border-radius:4px}
.pill.critical{background:#C93A3A;color:#fff}
.pill.high{background:#F8E1E1;color:#A12E2E}
.pill.medium{background:#F8EBD3;color:#8A570A}
.pill.low{background:#EEF0F3;color:#3A4456}
.data td{padding:4px 6px}
.data td:last-child{text-align:right;font-variant-numeric:tabular-nums}
.data.wide td:not(:first-child),.data.wide th:not(:first-child){text-align:right}
.page-break{page-break-before:always}
.foot{margin-top:8mm;font-size:8pt;color:#5B6577}
</style>
</head>
<body>
  <header>
    <div>
      <h1>${esc(client.name)}</h1>
      <p class="sub">SEO audit for ${esc(client.websiteUrl)}</p>
    </div>
    <div class="meta">${date}<br>${esc(client.city)}, ${esc(client.state)}<br>${esc(client.businessType)}</div>
  </header>

  <section class="score">
    <div>
      <div class="big">${score}<small> / 100</small></div>
      <div class="verdict">${VERDICTS[tone]}</div>
      ${scale(score)}
    </div>
    <div>${breakdownRows(result.score_breakdown)}</div>
  </section>

  <h2>Summary</h2>
  <p class="summary">${esc(result.executive_summary)}</p>

  <div class="cols">
    <div class="critical">
      <h2>Fix first</h2>
      ${list(result.critical_issues, 'No critical issues found.')}
    </div>
    <div class="wins">
      <h2>Quick wins</h2>
      ${list(result.quick_wins, 'No quick wins this month.')}
    </div>
  </div>

  ${result.important_issues.length ? `<div class="important"><h2>Also important</h2>${list(result.important_issues, '')}</div>` : ''}

  <h2 class="page-break">Recommendations</h2>
  <table class="recs">
    <thead><tr><th>Priority</th><th>Finding and fix</th><th>Impact</th><th>How we'll know it worked</th></tr></thead>
    <tbody>${recommendationRows(result.recommendations)}</tbody>
  </table>

  <h2 class="page-break">Data behind this audit</h2>
  ${signalTables(signals)}
  <p class="foot">Audit ${esc(audit.id)}, triggered ${audit.triggeredBy === 'cron' ? 'by the monthly schedule' : 'manually'}. Analysis by ${esc(analysedBy || 'Claude')}.</p>
</body>
</html>`;
}

module.exports = { renderReportHtml };
