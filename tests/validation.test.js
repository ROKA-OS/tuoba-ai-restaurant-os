import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, clampCopies, clampPrep, isValidPhone } from '../lib/validation.js';

test('parseMoney rejects negative/NaN/zero by default', () => {
  assert.equal(parseMoney('100'), 100);
  assert.equal(parseMoney('-5'), null);
  assert.equal(parseMoney('abc'), null);
  assert.equal(parseMoney('0'), null);
  assert.equal(parseMoney('0', { allowZero: true }), 0);
});

test('clampCopies guards NaN and caps', () => {
  assert.equal(clampCopies('2'), 2);
  assert.equal(clampCopies('abc'), 1);
  assert.equal(clampCopies('0'), 1);
  assert.equal(clampCopies('999'), 20);
});

test('clampPrep guards invalid', () => {
  assert.equal(clampPrep('15'), 15);
  assert.equal(clampPrep('-3'), 20);
  assert.equal(clampPrep('abc'), 20);
});

test('isValidPhone', () => {
  assert.equal(isValidPhone('01000000001'), true);
  assert.equal(isValidPhone('+201000000001'), true);
  assert.equal(isValidPhone('abc'), false);
  assert.equal(isValidPhone('123'), false);
});
