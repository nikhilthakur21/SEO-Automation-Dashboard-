// Vercel only serves the dashboard, so it never needs a browser download
module.exports = {
  skipDownload: process.env.VERCEL === '1',
};
