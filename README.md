# SEO Automation Dashboard

Built for the Edgelink Technology AI Developer & Automation Engineer assessment.

A dashboard that audits local business websites every month. Each audit crawls the site, pulls in PageSpeed, Search Console and ranking data, asks Claude for a prioritised set of fixes, stores everything in Postgres, renders a PDF report and sends it to the client on WhatsApp and email.

There are two portals in the same app:

- `/admin` for the agency: clients, audit history, live job progress, the raw Claude JSON and the signals behind it.
- `/portal` for the business owner: their latest score, what to fix first, quick wins, past reports and the PDF.

## Live demo

- App: `https://<your-vercel-app>.vercel.app`
- Worker health check: `https://<your-render-worker>.onrender.com/health`

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@edgelink.test` | `<ADMIN_PASSWORD>` |
| Client | `clinic@smilestudio.test` | `<CLIENT_PASSWORD>` |

The sign-in page also has buttons that fill these in. To try the pipeline, sign in as admin, open **Clients** and press **Run audit**. The audit page shows each step as the worker reaches it, then the report, the Claude JSON and the delivery log.

## How an audit runs

```
Run audit button / monthly cron
        |
        v
POST /api/audit  ->  Audit row (QUEUED)  ->  BullMQ queue "seo-audit-jobs" on Upstash Redis
                                                   |
                                                   v
                                     Worker (long-running Node process)
                                       1. fetch + cheerio crawl
                                       2. PageSpeed Insights   (mock)
                                       3. Search Console       (mock)
                                       4. Schema.org validation
                                       5. On-page analysis
                                       6. robots.txt + sitemap.xml
                                       7. DataForSEO rankings  (mock)
                                                   |
                                                   v
                                     Claude (claude-sonnet-4-6) -> structured JSON
                                                   |
                                                   v
                                     Postgres: signals, result, scores
                                                   |
                                                   v
                                     Puppeteer PDF -> /tmp/reports + Supabase Storage
                                                   |
                                                   v
                                     WhatsApp + email (console mocks), Notification rows
```

The worker writes `progress` and `currentStep` to the audit row as it goes, and the admin page polls `GET /api/audit/[id]` to show it.

## Stack

| Part | Choice |
| --- | --- |
| Web app and API | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Queue | BullMQ on Upstash Redis |
| Worker | Node.js process in Docker on Render |
| Crawler | fetch + cheerio |
| Analysis | Anthropic SDK, `claude-sonnet-4-6`, structured outputs validated with zod |
| Database | Supabase Postgres with Prisma |
| Reports | Puppeteer, stored in Supabase Storage |
| Scheduling | cron-job.org calling `/api/cron/audits` every minute |

## Project layout

```
prisma/
  schema.prisma        Client, Audit, Notification
  seed.js              two demo clients
public/
  sample-clinic.html   demo client sites the crawler can always reach
  sample-realty.html
src/
  app/                 pages, server actions and API routes
  components/          UI (shadcn components live in components/ui)
  crawlers/            one file per pipeline step
  lib/                 prisma, queue, Claude prompt and call, PDF, storage, auth
  mocks/               USE_MOCKS toggle and the mock data from the brief
  worker/              BullMQ worker and the audit pipeline
```

## Running locally

You need Node 20 or newer, a Postgres database and a Redis URL (the free Supabase and Upstash tiers are fine).

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, REDIS_URL and the auth values
npx prisma db push
npm run db:seed
npm run dev                 # dashboard on http://localhost:3000
npm run worker:dev          # worker in a second terminal
```

`npm install` downloads a Chromium build for Puppeteer. If you would rather use an installed Chrome, set `PUPPETEER_EXECUTABLE_PATH`.

## Mocks

All mock behaviour hangs off one flag in `src/mocks/index.js`:

```
USE_MOCKS=true   # set false when connecting real APIs
```

With it on, PageSpeed, Search Console, DataForSEO, Twilio and email return the mock data from the brief. Every integration file follows the same pattern, so each real call sits right below its `if (USE_MOCKS)` line.

Claude is the exception. If `ANTHROPIC_API_KEY` is set, the analysis runs on Claude even when mocks are on. Without a key, `src/mocks/claude.mock.js` builds a response in the same JSON shape from the crawl results, so the report always matches the site that was crawled.

The same builder is the fallback when a Claude call fails (no credit left, a revoked key, an outage). The worker logs the reason and the audit still completes, and the Claude JSON tab on the audit page says the built-in analysis was used and why. A real Claude audit takes about 80 seconds and around 3K input and 3.5K output tokens.

## Deploying

1. **Supabase**: create a project and copy two connection strings from Project Settings > Database. The transaction pooler (port 6543, add `?pgbouncer=true&connection_limit=1`) goes in `DATABASE_URL`, and the session pooler (port 5432) goes in `DIRECT_URL`. Copy the project URL and service role key for Storage. The `reports` bucket is created on the first upload.
2. **Upstash**: create a Redis database and copy the `rediss://` URL into `REDIS_URL`.
3. **Schema and seed**: run `npx prisma db push`, then `APP_URL=https://<your-vercel-app>.vercel.app npm run db:seed` so the demo clients point at the deployed sample sites.
4. **Worker on Render**: create a web service from this repo with the Docker runtime (or use `render.yaml`). Add the database, Redis, Supabase and Anthropic variables. It serves `/health` and runs the BullMQ worker.
5. **Vercel**: import the repo and add every variable from `.env.example`. Set `WORKER_URL` to the Render URL and `APP_URL` to the Vercel URL.
6. **cron-job.org**: add a job that calls `https://<your-vercel-app>.vercel.app/api/cron/audits` every minute with the header `x-cron-secret: <CRON_SECRET>`.

## Notes

- Render's free plan doesn't include background workers, so the worker runs as a web service with a `/health` route. The cron route pings it every minute, which also wakes it up if it went to sleep.
- If `WORKER_URL` isn't set, the cron route processes queued jobs itself (`CRON_BATCH_SIZE`, default 1). That only works on a host where Puppeteer can start Chrome, so not on Vercel.
- A client is due for its monthly audit when it hasn't had one in 30 days. The cron route queues at most `CRON_ENQUEUE_LIMIT` (default 5) per run.
- BullMQ polls Redis even when idle. I set `drainDelay` to 60s and the stalled check to every 5 min, which keeps an idle worker well under Upstash's 500K commands/month.
- PDFs go to `/tmp/reports` (the R2 stand-in from the brief) and then to Supabase Storage, since the worker's disk is wiped on restart and Vercel can't read it anyway. `/api/audit/[id]/pdf` checks the session and redirects to a signed URL.
- Supabase pauses free projects after a week of no activity. The cron route hits the DB every minute and Storage once an hour, so that shouldn't happen.
- The prompts in `src/lib/prompt.js` are copied from the brief as is. Claude's reply goes through structured outputs with a zod schema, so it's validated before it's saved.
- The given schema has no users table, so I didn't add one. Admin login comes from env vars, and clients log in with their client email plus a shared `CLIENT_PASSWORD`. A real deployment would need per-client accounts or magic links.
- The brief asks for Next.js 14, so this runs on 14.2.35 (the last 14.x). `npm audit` reports advisories that are only fixed in 15+, mostly for features not used here (`next/image`, rewrites).
