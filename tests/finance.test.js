import { test } from 'node:test';
import assert from 'node:assert/strict';
import { branchPL, brandPL, recipeMargin } from '../lib/finance.js';

const BRANDS = { B1: ['Giza', 'Nasr'], B2: ['Zayed'] };
const state = {
  geidea: [
    { brand: 'B1', branch: 'Giza', total: 1000 },
    { brand: 'B1', branch: 'Nasr', total: 500 },
  ],
  finance: [
    { brand: 'B1', branch: 'Giza', foodCost: 300, payroll: 200, rent: 100, other: 50 },
    { brand: 'B1', branch: 'Nasr', foodCost: 100, payroll: 50, rent: 50, other: 0 },
  ],
};

test('branchPL computes sales, cost, profit, margin', () => {
  const p = branchPL(state, 'B1', 'Giza');
  assert.equal(p.sales, 1000);
  assert.equal(p.totalCost, 650);
  assert.equal(p.profit, 350);
  assert.equal(p.margin, 35);
});

test('branchPL with no sales gives margin 0', () => {
  const p = branchPL(state, 'B1', 'Missing');
  assert.equal(p.sales, 0);
  assert.equal(p.margin, 0);
  assert.equal(p.profit, 0);
});

test('brandPL aggregates branches', () => {
  const b = brandPL(state, 'B1', BRANDS);
  assert.equal(b.sales, 1500);
  assert.equal(b.totalCost, 850);
  assert.equal(b.profit, 650);
});

test('recipeMargin handles zero price', () => {
  assert.equal(recipeMargin(30, 100), 70);
  assert.equal(recipeMargin(30, 0), 0);
});
