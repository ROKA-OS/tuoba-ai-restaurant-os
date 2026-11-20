// HTML escaping helpers — single source of truth for XSS prevention.
// Every user-controlled value rendered via innerHTML MUST pass through escapeHtml().

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// For attribute contexts (value="...", href="...", data-*).
// Same escaping as escapeHtml because quotes are escaped.
export function escapeAttr(value) {
  return escapeHtml(value);
}

// Validate a URL before putting it in href/src. Only http(s) allowed.
export function safeUrl(url) {
  const s = String(url ?? '').trim();
  if (/^(https?:\/\/)/i.test(s)) return s;
  return '#';
}
