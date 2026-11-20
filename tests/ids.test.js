import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newId, newOrderNo } from '../lib/ids.js';

test('newId generates unique values with prefix', () => {
  const a = newId('ORD');
  const b = newId('ORD');
  assert.match(a, /^ORD-/);
  assert.notEqual(a, b);
});

test('newOrderNo generates unique values in a burst', () => {
  const ids = new Set(Array.from({ length: 100 }, () => newOrderNo()));
  assert.equal(ids.size, 100);
});
