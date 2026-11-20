// Attendance math — replaces the old hardcoded hoursWorked=9 / overtime=1.

function toDate(v) {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function minutesOfDay(d) {
  return d.getHours() * 60 + d.getMinutes();
}

function parseHHMM(s, fallback) {
  const m = String(s || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  return Number(m[1]) * 60 + Number(m[2]);
}

// Compute worked hours + overtime from actual timestamps.
// shiftStart/shiftEnd are "HH:MM" strings. Overnight shifts (end <= start) are supported.
export function computeHours(checkInAt, checkOutAt, shiftStart = '09:00', shiftEnd = '18:00') {
  const start = toDate(checkInAt);
  const end = toDate(checkOutAt);
  if (!start || !end || end <= start) return { hoursWorked: 0, overtime: 0 };

  const diffMin = (end.getTime() - start.getTime()) / 60000;
  const hoursWorked = Math.round((diffMin / 60) * 100) / 100;

  let shiftMin = parseHHMM(shiftEnd, 18 * 60) - parseHHMM(shiftStart, 9 * 60);
  if (shiftMin <= 0) shiftMin += 24 * 60; // overnight shift
  const shiftHours = shiftMin / 60;
  const overtime = Math.max(0, Math.round((hoursWorked - shiftHours) * 100) / 100);
  return { hoursWorked, overtime };
}

export function minutesLeft(readyAt, now = Date.now()) {
  const t = new Date(readyAt).getTime();
  if (Number.isNaN(t)) return 0;
  const diff = Math.ceil((t - now) / 60000);
  return diff > 0 ? diff : 0;
}
