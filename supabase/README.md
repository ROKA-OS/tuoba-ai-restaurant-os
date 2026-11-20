# Supabase Backend — TUOBA Restaurant OS (Phase 2)

## Status
Backend SQL + client + migration tool are ready in this repo. Live provisioning is
pending a free Supabase project slot (free tier allows 2 active projects per owner).

## 1) Create / free a project
- Option A: Pause or delete one of your 2 active free projects, then create
  `tuoba-restaurant-os` (region `eu-central-1` recommended — closest to Cairo).
- Option B: Upgrade to Pro, then create the project.
- Option C: Use an existing inactive project — restore it from the Supabase
  dashboard first (API restore was denied with 403 for `Tuoba os`).

## 2) Apply schema + seed
In the Supabase Dashboard → SQL Editor, run in order:
1. `schema.sql` (tables, views, RLS, realtime, storage bucket)
2. `seed.sql` (brands, branches, menu, shifts, finance, tables, printers)

Or via CLI: `supabase db push` after linking the project.

## 3) Configure Auth
- Dashboard → Authentication → Providers: enable Email.
- Disable public sign-up (`disable_signup = true`) — create staff users manually.
- After creating a user, insert a profile row:
  ```sql
  insert into public.profiles (id, brand_id, branch_id, role, display_name)
  values ('<auth-user-uuid>', '<brand-uuid>', '<branch-uuid>', 'manager', 'Name');
  ```
- Roles: `admin` (all brands), `manager`, `cashier`, `kitchen`, `driver`, `viewer`.

## 4) Connect the PWA (optional, local mode still works without this)
1. Copy `supabase/config.example.js` → `config.js` (git-ignored) with your
   `SUPABASE_URL` + `SUPABASE_ANON_KEY` (Dashboard → Settings → API).
2. Add `<script src="config.js"></script>` BEFORE `<script type="module" src="app.js">` in `index.html`.
3. The app stays local-first; `lib/supabase-client.js` enables Realtime
   subscriptions when configured. Full sync wiring is the next step.

## 5) Migrate existing localStorage data
1. In the PWA: Export (choose redacted or full).
2. Run:
   ```bash
   npm i -D @supabase/supabase-js
   SUPABASE_URL=https://<ref>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
   node tools/migrate-localstorage.mjs ./export.json --dry-run
   # remove --dry-run to apply
   ```
   ⚠️ Use the **service_role** key only in this local script — never in the browser.

## 6) Storage
- Bucket `receipts` (private) holds expense receipt images.
- Upload via `supabase.storage.from('receipts').upload(...)`, store the path in
  `expenses.receipt_url`.

## Schema map (localStorage → Postgres)
| Local | Postgres |
|---|---|
| `BRANDS` | `brands` + `branches` |
| `MENU` | `menu_items` |
| `orders` / `order_items` | `orders` / `order_items` |
| `payments` | `payments` |
| `expenses` | `expenses` (+ `receipts` bucket) |
| `recipes` | `recipes` (margin generated) |
| `finance` | `finance_entries` |
| `geidea` / `geideaImports` | `geidea_sales` / `geidea_imports` |
| `customers` | `customers` |
| `customerCalls` | `customer_calls` |
| `attendance` / `shifts` | `attendance` / `shifts` |
| `printers` (per branch) | `printer_settings` |
| `securityLogs` | `security_logs` |
| P&L math | `branch_pnl` / `brand_pnl` views |
