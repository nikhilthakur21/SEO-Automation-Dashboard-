const { USE_MOCKS } = require('../mocks');
const mock = require('../mocks/twilio.mock');

async function sendWhatsApp(clientId, pdfPath, score, { to, reportUrl } = {}) {
  if (USE_MOCKS) return mock.sendWhatsApp(clientId, pdfPath, score);

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({
    From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    To: `whatsapp:${to}`,
    Body: `Your monthly SEO audit is ready. Overall score: ${score}/100.`,
  });
  if (reportUrl) body.set('MediaUrl', reportUrl);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Twilio returned HTTP ${res.status}`);
  const data = await res.json();
  return { status: 'sent', sid: data.sid };
}

module.exports = { sendWhatsApp };
