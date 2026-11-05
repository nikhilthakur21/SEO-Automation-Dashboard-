/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bullmq', 'ioredis', 'puppeteer', 'cheerio'],
  },
};

export default nextConfig;
