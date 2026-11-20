import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, parseAmount, guessColumn } from '../lib/csv.js';

test('parseCSV handles quotes and commas inside quotes', () => {
  const { headers, rows } = parseCSV('Date,Amount,Note\n2026-01-01,"1,234.56","hello, world"\n2026-01-02,500,ok');
  assert.deepEqual(headers, ['Date', 'Amount', 'Note']);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Amount, '1,234.56');
  assert.equal(rows[0].Note, 'hello, world');
});

test('parseCSV empty input', () => {
  assert.deepEqual(parseCSV(''), { headers: [], rows: [] });
});

test('parseAmount US format', () => {
  assert.equal(parseAmount('1,234.56'), 1234.56);
  assert.equal(parseAmount('1234.56'), 1234.56);
});

test('parseAmount EU format', () => {
  assert.equal(parseAmount('1.234,56'), 1234.56);
  assert.equal(parseAmount('1234,56'), 1234.56);
});

test('parseAmount thousands-only and currency', () => {
  assert.equal(parseAmount('1,234'), 1234);
  assert.equal(parseAmount('EGP 500'), 500);
  assert.equal(parseAmount('(1,234.00)'), -1234);
  assert.equal(parseAmount(''), 0);
  assert.equal(parseAmount('abc'), 0);
});

test('guessColumn finds amount-like headers', () => {
  assert.equal(guessColumn(['Date', 'Total Amount'], ['amount', 'total']), 'Total Amount');
  assert.equal(guessColumn(['Foo'], ['amount']), '');
});
