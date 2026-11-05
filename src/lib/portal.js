import { cache } from 'react';
import { prisma } from '@/lib/prisma';

const DAY = 24 * 60 * 60 * 1000;

// layout and page both call this; cache() keeps it to one query per request
export const getPortalData = cache(async (clientId) => {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          status: true,
          progress: true,
          currentStep: true,
          overallScore: true,
          result: true,
          signals: true,
          pdfPath: true,
          createdAt: true,
          completedAt: true,
          notifications: { select: { channel: true, status: true } },
        },
      },
    },
  });
  if (!client) return null;

  const completed = client.audits.filter((a) => a.status === 'COMPLETED');
  return {
    client,
    completed,
    latest: completed[0] || null,
    previous: completed[1] || null,
    running: client.audits.find((a) => a.status === 'QUEUED' || a.status === 'RUNNING') || null,
  };
});

export function nextAuditDate(audit) {
  return new Date(new Date(audit.createdAt).getTime() + 30 * DAY);
}

export function searchTotals(gsc) {
  if (!gsc?.rows?.length) return null;
  const clicks = gsc.totalClicks ?? gsc.rows.reduce((n, r) => n + r.clicks, 0);
  const impressions = gsc.totalImpressions ?? gsc.rows.reduce((n, r) => n + r.impressions, 0);
  const weighted = gsc.rows.reduce((n, r) => n + r.position * r.impressions, 0);
  const rowImpressions = gsc.rows.reduce((n, r) => n + r.impressions, 0);
  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: rowImpressions ? weighted / rowImpressions : null,
  };
}

export function mainRanking(rankings) {
  const result = rankings?.tasks?.[0]?.result?.[0];
  if (!result) return null;
  return {
    keyword: result.keyword,
    position: rankings.client_rank_position,
    volume: rankings.keyword_search_volume,
    items: result.items || [],
  };
}

const VITALS = [
  { key: 'largest-contentful-paint', label: 'Largest Contentful Paint', short: 'Loading', good: 2.5, poor: 4, unit: 's', target: 'Good is 2.5 s or less' },
  { key: 'interaction-to-next-paint', label: 'Interaction to Next Paint', short: 'Responsiveness', good: 200, poor: 500, unit: 'ms', target: 'Good is 200 ms or less' },
  { key: 'cumulative-layout-shift', label: 'Cumulative Layout Shift', short: 'Visual stability', good: 0.1, poor: 0.25, unit: '', target: 'Good is 0.1 or less' },
];

export function coreVitals(pagespeed) {
  const audits = pagespeed?.audits;
  if (!audits) return [];
  return VITALS.filter((v) => audits[v.key]?.displayValue).map((v) => {
    const display = audits[v.key].displayValue;
    const value = parseFloat(display.replace(/,/g, ''));
    const tone = value <= v.good ? 'good' : value <= v.poor ? 'warn' : 'poor';
    return { ...v, display, tone };
  });
}
