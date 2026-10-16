const config = require('../config');

// API response-er format alada hole shudhu normalize() thik korun.
function normalize(d) {
  let r = d.result ?? d.data ?? d;
  if (Array.isArray(r)) r = r[0] || {};
  const url = r.url ?? r.video ?? r.download ?? r.link ?? r.hd ?? r.sd;
  if (!url) throw new Error('API theke video link paoa jayni');
  return { url, title: r.title || '' };
}

async function fetchMedia(link) {
  const u = new URL(config.apiPath, config.apiBase);
  u.searchParams.set('url', link);

  const res = await fetch(u, {
    headers: config.apiKey ? { 'x-api-key': config.apiKey } : {},
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return normalize(await res.json());
}

module.exports = { fetchMedia };
