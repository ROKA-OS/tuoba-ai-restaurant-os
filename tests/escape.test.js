import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, escapeAttr, safeUrl } from '../lib/escape.js';

test('escapeHtml neutralizes tags and quotes', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(escapeHtml('"><script>alert(1)</script>'), '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml("a'b&c"), 'a&#39;b&amp;c');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

test('escapeAttr escapes quotes for attribute contexts', () => {
  assert.equal(escapeAttr('" onmouseover="alert(1)'), '&quot; onmouseover=&quot;alert(1)');
});

test('safeUrl only allows http(s)', () => {
  assert.equal(safeUrl('https://example.com'), 'https://example.com');
  assert.equal(safeUrl('http://example.com'), 'http://example.com');
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,<script>'), '#');
  assert.equal(safeUrl(''), '#');
});
