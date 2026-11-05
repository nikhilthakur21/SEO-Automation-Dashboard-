const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// both sites are served from /public so the crawler always has a live target
const clients = [
  {
    name: 'Smile Studio Dental',
    websiteUrl: `${base}/sample-clinic.html`,
    businessType: 'Dental clinic',
    city: 'Pune',
    state: 'Maharashtra',
    whatsapp: '+919800000001',
    email: process.env.DEMO_CLIENT_EMAIL || 'clinic@smilestudio.test',
  },
  {
    name: 'Lotus Homes Realty',
    websiteUrl: `${base}/sample-realty.html`,
    businessType: 'Real estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    whatsapp: '+919800000002',
    email: 'sales@lotushomes.test',
  },
];

async function main() {
  for (const client of clients) {
    await prisma.client.upsert({ where: { websiteUrl: client.websiteUrl }, update: client, create: client });
  }
  console.log(`Seeded ${clients.length} clients for ${base}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
