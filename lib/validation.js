// Input validation helpers — pure and testable.

export function parseMoney(raw, { allowZero = false } = {}) {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  if (!allowZero && n === 0) return null;
  return n;
}

export function clampCopies(raw, fallback = 1) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 20); // sanity cap
}

export function clampPrep(raw, fallback = 20) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 480); // max 8h
}

export function isValidPhone(phone) {
  const s = String(phone ?? '').replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(s);
}

export function sanitizeText(raw, maxLen = 500) {
  return String(raw ?? '').trim().slice(0, maxLen);
}
