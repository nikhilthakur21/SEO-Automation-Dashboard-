export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options }).format(
    new Date(value),
  );
}

export function formatDateTime(value) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(value) {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 86400 * 14) return `${Math.floor(seconds / 86400)} d ago`;
  return formatDate(value);
}

export function hostname(url) {
  try {
    const { host, pathname } = new URL(url);
    return host.replace(/^www\./, '') + (pathname === '/' ? '' : pathname.replace(/\/$/, ''));
  } catch {
    return url;
  }
}

export function duration(start, end) {
  if (!start || !end) return null;
  const seconds = Math.round((new Date(end) - new Date(start)) / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
