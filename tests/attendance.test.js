import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeHours, minutesLeft } from '../lib/attendance.js';

test('computeHours basic 9h shift, no overtime', () => {
  const r = computeHours('2026-01-01T09:00:00', '2026-01-01T18:00:00', '09:00', '18:00');
  assert.equal(r.hoursWorked, 9);
  assert.equal(r.overtime, 0);
});

test('computeHours overtime beyond shift', () => {
  const r = computeHours('2026-01-01T09:00:00', '2026-01-01T20:30:00', '09:00', '18:00');
  assert.equal(r.hoursWorked, 11.5);
  assert.equal(r.overtime, 2.5);
});

test('computeHours invalid range returns zeros', () => {
  assert.deepEqual(computeHours('2026-01-01T18:00:00', '2026-01-01T09:00:00'), { hoursWorked: 0, overtime: 0 });
  assert.deepEqual(computeHours('bad', '2026-01-01T09:00:00'), { hoursWorked: 0, overtime: 0 });
});

test('minutesLeft clamps at zero', () => {
  const now = new Date('2026-01-01T12:00:00').getTime();
  assert.equal(minutesLeft('2026-01-01T12:10:00', now), 10);
  assert.equal(minutesLeft('2026-01-01T11:00:00', now), 0);
  assert.equal(minutesLeft('bad', now), 0);
});
