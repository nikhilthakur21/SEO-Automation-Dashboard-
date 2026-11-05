const { USE_MOCKS } = require('../mocks');
const mock = require('../mocks/email.mock');

async function sendEmail(clientId, to, pdfPath, score, { pdf, clientName } = {}) {
  if (USE_MOCKS) return mock.sendEmail(clientId, to, pdfPath, score);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject: `SEO audit for ${clientName}: ${score}/100`,
      html: `<p>Hi,</p><p>Your latest SEO audit is attached. Overall score: <strong>${score}/100</strong>.</p>`,
      attachments: pdf ? [{ filename: 'seo-audit.pdf', content: pdf.toString('base64') }] : [],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Email provider returned HTTP ${res.status}`);
  const data = await res.json();
  return { status: 'sent', id: data.id };
}

module.exports = { sendEmail };
