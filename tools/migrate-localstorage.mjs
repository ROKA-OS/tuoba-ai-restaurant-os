#!/usr/bin/env node
// Migrate an exported TUOBA localStorage JSON (via the app's Export button)
// into Supabase. Usage:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//     node tools/migrate-localstorage.mjs ./export.json [--dry-run]
// Requires: npm i @supabase/supabase-js (dev-only, not needed by the PWA itself).

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const file = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!file || !url || !serviceKey) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/migrate-localstorage.mjs <export.json> [--dry-run]');
  process.exit(1);
}

const state = JSON.parse(await readFile(file, 'utf8'));
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function upsert(table, rows, onConflict) {
  if (!rows.length) return { data: [], error: null };
  if (dryRun) {
    console.log(`[dry-run] would upsert ${rows.length} row(s) into ${table}`);
    return { data: rows, error: null };
  }
  return supabase.from(table).upsert(rows, { onConflict });
}

const brandIds = new Map();
const branchIds = new Map();

async function ensureBrandsBranches() {
  const brands = [...new Set([...(state.finance || []).map((f) => f.brand), ...(state.orders || []).map((o) => o.brand), ...(state.customers || []).map((c) => c.brand)])].filter(Boolean);
  for (const name of brands) {
    const { data } = await upsert('brands', [{ name }], 'name');
    brandIds.set(name, data[0].id);
    const branches = [...new Set([...(state.finance || []).filter((f) => f.brand === name).map((f) => f.branch), ...(state.orders || []).filter((o) => o.brand === name).map((o) => o.branch)])].filter(Boolean);
    for (const branch of branches) {
      const { data: b } = await upsert('branches', [{ brand_id: brandIds.get(name), name: branch }], 'brand_id,name');
      branchIds.set(`${name}||${branch}`, b[0].id);
    }
  }
}

function ids(brand, branch) {
  return { brand_id: brandIds.get(brand), branch_id: branchIds.get(`${brand}||${branch}`) };
}

async function main() {
  await ensureBrandsBranches();

  // Finance
  const finance = (state.finance || []).map((f) => ({ ...ids(f.brand, f.branch), food_cost: f.foodCost || 0, payroll: f.payroll || 0, rent: f.rent || 0, other: f.other || 0 }));
  await upsert('finance_entries', finance, 'brand_id,branch_id');

  // Orders + items
  for (const o of state.orders || []) {
    const { data: order } = await upsert('orders', [{
      ...ids(o.brand, o.branch), order_no: o.orderNo, mode: o.mode, table_label: o.table || '',
      customer: o.customer || {}, payment: o.payment || 'cash', total: o.total || 0,
      prep_minutes: o.prepMinutes || 5, status: o.status || 'preparing',
      cashier_copies: o.cashierCopies || 1, kitchen_copies: o.kitchenCopies || 1, pickup_copies: o.pickupCopies || 1,
      created_at: o.createdAt, ready_at: o.readyAt,
    }], 'order_no');
    const items = (o.items || []).map((i) => ({ order_id: order[0].id, name_snapshot: i.name_en || i.name_ar || '', qty: i.qty || 1, price: i.price || 0 }));
    await upsert('order_items', items, 'id');
  }

  // Customers
  await upsert('customers', (state.customers || []).map((c) => ({ ...ids(c.brand, c.branch), name: c.name, phone: c.phone, last_payment: c.lastPayment || '' })), 'brand_id,branch_id,phone');

  // Payments
  await upsert('payments', (state.payments || []).map((p) => ({ ...ids(p.brand, p.branch), customer: p.customer, phone: p.phone, amount: p.amount, method: p.method, tx_id: p.txId })), 'tx_id');

  // Expenses (receiptData DataURLs are NOT migrated — upload images to the receipts bucket separately)
  await upsert('expenses', (state.expenses || []).map((e) => ({ ...ids(e.brand, e.branch), title: e.title, amount: e.amount, note: e.note || '', receipt_url: '' })), 'id');

  // Recipes
  await upsert('recipes', (state.recipes || []).map((r) => ({ ...ids(r.brand, r.branch), name: r.name, cost: r.cost, price: r.price, ingredients: r.ingredients || '' })), 'id');

  // Geidea
  await upsert('geidea_sales', (state.geidea || []).map((g) => ({ ...ids(g.brand, g.branch), total: g.total || 0, count: g.count || 0, avg: g.avg || 0 })), 'brand_id,branch_id');
  await upsert('geidea_imports', (state.geideaImports || []).map((g) => ({ ...ids(g.brand, g.branch), total: g.total || 0, count: g.count || 0, avg: g.avg || 0, file_name: g.fileName || '' })), 'id');

  // Call center
  await upsert('customer_calls', (state.customerCalls || []).map((c) => ({ ...ids(c.brand, c.branch), call_no: c.id, phone: c.phone, customer_name: c.customerName, type: c.type, zone: c.zone || '', order_text: c.orderText, status: c.status, driver: c.driver || '', created_at: c.createdAt, ready_at: c.readyAt })), 'call_no');

  // Attendance
  await upsert('attendance', (state.attendance || []).map((a) => ({ ...ids(a.brand, a.branch), employee: a.employee, shift_name: a.shift, check_in_at: a.checkInAt, check_out_at: a.checkOutAt || null, location_label: a.location || '', hours_worked: a.hoursWorked || 0, overtime: a.overtime || 0 })), 'id');

  console.log(dryRun ? 'Dry-run complete.' : 'Migration complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
