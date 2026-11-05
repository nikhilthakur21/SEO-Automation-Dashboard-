const fs = require('fs/promises');
const { createClient } = require('@supabase/supabase-js');

const REPORTS_DIR = process.env.REPORTS_DIR || '/tmp/reports';
const BUCKET = process.env.SUPABASE_BUCKET || 'reports';

let supabase;
let bucketReady = false;

function storageClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  supabase ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return supabase;
}

async function ensureBucket(client) {
  if (bucketReady) return;
  const { error } = await client.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create storage bucket: ${error.message}`);
  bucketReady = true;
}

// local copy stands in for R2; Supabase Storage keeps it reachable from Vercel
async function saveReport(auditId, pdf) {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const pdfPath = `${REPORTS_DIR}/${auditId}.pdf`;
  await fs.writeFile(pdfPath, pdf);

  const client = storageClient();
  if (client) {
    await ensureBucket(client);
    const { error } = await client.storage
      .from(BUCKET)
      .upload(`${auditId}.pdf`, pdf, { contentType: 'application/pdf', upsert: true });
    if (error) throw new Error(`PDF upload failed: ${error.message}`);
  }
  return pdfPath;
}

async function getReportUrl(auditId, { expiresIn = 600, filename } = {}) {
  const client = storageClient();
  if (!client) return null;
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(`${auditId}.pdf`, expiresIn, filename ? { download: filename } : undefined);
  return error ? null : data.signedUrl;
}

async function readLocalReport(auditId) {
  try {
    return await fs.readFile(`${REPORTS_DIR}/${auditId}.pdf`);
  } catch {
    return null;
  }
}

async function pingStorage() {
  const client = storageClient();
  if (client) await client.storage.listBuckets();
}

module.exports = { saveReport, getReportUrl, readLocalReport, pingStorage };
