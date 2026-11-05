import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

// the realty sample is left out on purpose so its audit flags a sitemap gap
export default function sitemap() {
  const base = siteUrl();
  return [
    { url: `${base}/login`, changeFrequency: 'yearly' },
    { url: `${base}/sample-clinic.html`, changeFrequency: 'monthly' },
  ];
}
