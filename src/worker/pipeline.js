const { prisma } = require('../lib/prisma');
const { STEPS } = require('../lib/steps');
const { crawlPage } = require('../crawlers/crawl');
const { getPageSpeed } = require('../crawlers/pagespeed');
const { getSearchConsole } = require('../crawlers/gsc');
const { validateSchema } = require('../crawlers/schema');
const { analyseOnPage } = require('../crawlers/onpage');
const { checkRobotsAndSitemap } = require('../crawlers/robots');
const { getRankings } = require('../crawlers/dataforseo');
const { analyseSignals } = require('../lib/claude');
const { renderReportHtml } = require('../lib/report-html');
const { generatePdf } = require('../lib/pdf');
const { saveReport, getReportUrl } = require('../lib/storage');
const { sendWhatsApp } = require('../lib/whatsapp');
const { sendEmail } = require('../lib/email');

const STEP = Object.fromEntries(STEPS.map((s) => [s.key, s]));

// a third-party outage should not sink the whole audit
async function external(fn) {
  try {
    return await fn();
  } catch (err) {
    return { error: err.message };
  }
}

async function notify(audit, client, pdfPath, pdf, score) {
  const reportUrl = await getReportUrl(audit.id, { expiresIn: 7 * 24 * 3600 });
  const channels = [];
  if (client.whatsapp) {
    channels.push(['whatsapp', () => sendWhatsApp(client.id, pdfPath, score, { to: client.whatsapp, reportUrl })]);
  }
  if (client.email) {
    channels.push(['email', () => sendEmail(client.id, client.email, pdfPath, score, { pdf, clientName: client.name })]);
  }

  for (const [channel, send] of channels) {
    let status = 'failed';
    let providerId = null;
    try {
      const res = await send();
      status = res.status;
      providerId = res.sid || res.id || null;
    } catch (err) {
      console.error(`[audit ${audit.id}] ${channel} delivery failed: ${err.message}`);
    }
    await prisma.notification.create({ data: { auditId: audit.id, channel, status, providerId } });
  }
}

async function runAudit(auditId) {
  const audit = await prisma.audit.findUnique({ where: { id: auditId }, include: { client: true } });
  if (!audit) throw new Error(`Audit ${auditId} not found`);
  const { client } = audit;
  const log = (msg) => console.log(`[audit ${auditId}] ${msg}`);

  const step = async (key) => {
    log(STEP[key].label);
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'RUNNING', progress: STEP[key].progress, currentStep: STEP[key].label, errorMessage: null },
    });
  };

  await step('crawl');
  const { html, technical } = await crawlPage(client.websiteUrl);
  const pageUrl = technical.finalUrl;

  await step('pagespeed');
  const pagespeed = await external(() => getPageSpeed(pageUrl));

  await step('gsc');
  const gsc = await external(() => getSearchConsole(client.websiteUrl));

  await step('schema');
  const schema = validateSchema(html);

  await step('onpage');
  const onPage = analyseOnPage(html, pageUrl, client);

  await step('robots');
  const robots = await checkRobotsAndSitemap(pageUrl);

  await step('rankings');
  const rankings = await external(() =>
    getRankings({
      domain: new URL(pageUrl).hostname,
      keyword: `${client.businessType} ${client.city}`.toLowerCase(),
      city: client.city,
      state: client.state,
    }),
  );

  const signals = { technical, pagespeed, gsc, schema, onPage, robots, rankings, collectedAt: new Date().toISOString() };

  await step('analysis');
  const { result, meta } = await analyseSignals(client, signals);
  signals.meta = meta;
  log(`analysis by ${meta.analysedBy}: score ${result.overall_score}, ${result.recommendations.length} recommendations`);

  await step('save');
  await prisma.audit.update({
    where: { id: auditId },
    data: { signals, result, overallScore: result.overall_score, scoreBreakdown: result.score_breakdown },
  });

  await step('pdf');
  const pdf = await generatePdf(renderReportHtml({ client, audit, result, signals }), {
    domain: new URL(client.websiteUrl).hostname,
  });
  const pdfPath = await saveReport(auditId, pdf);
  await prisma.audit.update({ where: { id: auditId }, data: { pdfPath } });
  log(`report saved to ${pdfPath}`);

  await step('notify');
  await notify(audit, client, pdfPath, pdf, result.overall_score);

  await prisma.audit.update({
    where: { id: auditId },
    data: { status: 'COMPLETED', progress: 100, currentStep: 'Completed', completedAt: new Date() },
  });
  log('completed');
}

async function markFailed(auditId, err, willRetry) {
  await prisma.audit.update({
    where: { id: auditId },
    data: willRetry
      ? { status: 'QUEUED', currentStep: 'Retrying after an error', errorMessage: err.message }
      : { status: 'FAILED', currentStep: 'Failed', errorMessage: err.message, completedAt: new Date() },
  });
}

module.exports = { runAudit, markFailed };
