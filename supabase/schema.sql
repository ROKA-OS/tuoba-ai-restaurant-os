-- TUOBA Restaurant OS — Supabase schema (Postgres 17)
-- Run in order: schema.sql -> seed.sql
-- All business tables are scoped by brand_id / branch_id. RLS is enabled everywhere.

create extension if not exists pgcrypto;

-- ============ Enums ============
do $$ begin
  create type user_role as enum ('admin', 'manager', 'cashier', 'kitchen', 'driver', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_mode as enum ('table', 'takeaway', 'delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('preparing', 'ready', 'picked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type call_status as enum ('new', 'assigned', 'out', 'delivered');
exception when duplicate_object then null; end $$;

-- ============ Core: brands / branches ============
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (brand_id, name)
);

-- ============ Users / roles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  role user_role not null default 'viewer',
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- ============ Menu ============
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name_ar text not null default '',
  name_en text not null default '',
  name_fr text not null default '',
  name_es text not null default '',
  name_tr text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  prep_minutes int not null default 5 check (prep_minutes >= 0),
  created_at timestamptz not null default now()
);

-- ============ Orders (POS) ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  order_no text not null unique,
  mode order_mode not null default 'table',
  table_label text not null default '',
  customer jsonb not null default '{}'::jsonb,
  payment text not null default 'cash',
  total numeric(12,2) not null default 0 check (total >= 0),
  prep_minutes int not null default 5 check (prep_minutes >= 0),
  status order_status not null default 'preparing',
  cashier_copies int not null default 1 check (cashier_copies between 1 and 20),
  kitchen_copies int not null default 1 check (kitchen_copies between 1 and 20),
  pickup_copies int not null default 1 check (pickup_copies between 1 and 20),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  ready_at timestamptz not null default (now() + interval '5 minutes')
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name_snapshot text not null default '',
  qty int not null default 1 check (qty > 0),
  price numeric(12,2) not null default 0 check (price >= 0)
);

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  label text not null,
  occupied boolean not null default false,
  unique (branch_id, label)
);

-- ============ Payments / Expenses / Recipes ============
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  customer text not null default '',
  phone text not null default '',
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash',
  tx_id text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  title text not null default '',
  amount numeric(12,2) not null check (amount > 0),
  note text not null default '',
  receipt_url text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null default '',
  cost numeric(12,2) not null default 0 check (cost >= 0),
  price numeric(12,2) not null default 0 check (price > 0),
  ingredients text not null default '',
  margin int generated always as (case when price > 0 then round(((price - cost) / price) * 100)::int else 0 end) stored,
  created_at timestamptz not null default now()
);

-- ============ Finance / Geidea ============
create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  food_cost numeric(14,2) not null default 0 check (food_cost >= 0),
  payroll numeric(14,2) not null default 0 check (payroll >= 0),
  rent numeric(14,2) not null default 0 check (rent >= 0),
  other numeric(14,2) not null default 0 check (other >= 0),
  unique (brand_id, branch_id)
);

create table if not exists public.geidea_sales (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  total numeric(14,2) not null default 0,
  count int not null default 0 check (count >= 0),
  avg numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (brand_id, branch_id)
);

create table if not exists public.geidea_imports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  total numeric(14,2) not null default 0,
  count int not null default 0 check (count >= 0),
  avg numeric(14,2) not null default 0,
  file_name text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ CRM / Call Center ============
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  last_payment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, branch_id, phone)
);

create table if not exists public.customer_calls (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  call_no text not null unique,
  phone text not null default '',
  customer_name text not null default '',
  type text not null default 'delivery',
  zone text not null default '',
  order_text text not null default '',
  status call_status not null default 'new',
  driver text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  ready_at timestamptz not null default (now() + interval '20 minutes')
);

-- ============ HR ============
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  unique (brand_id, name)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  employee text not null default '',
  shift_name text not null default '',
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  location_label text not null default '',
  hours_worked numeric(8,2) not null default 0 check (hours_worked >= 0),
  overtime numeric(8,2) not null default 0 check (overtime >= 0)
);

-- ============ Printing / Security ============
create table if not exists public.printer_settings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null unique references public.branches(id) on delete cascade,
  cashier_copies int not null default 1 check (cashier_copies between 1 and 20),
  kitchen_copies int not null default 1 check (kitchen_copies between 1 and 20),
  pickup_copies int not null default 1 check (pickup_copies between 1 and 20)
);

create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  type text not null default '',
  detail text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ Indexes ============
create index if not exists idx_orders_branch_status on public.orders (branch_id, status);
create index if not exists idx_orders_created on public.orders (created_at desc);
create index if not exists idx_calls_branch_status on public.customer_calls (branch_id, status);
create index if not exists idx_payments_branch on public.payments (branch_id, created_at desc);
create index if not exists idx_attendance_branch on public.attendance (branch_id, employee);
create index if not exists idx_customers_phone on public.customers (brand_id, branch_id, phone);

-- ============ P&L Views ============
create or replace view public.branch_pnl as
select
  b.id as branch_id,
  b.name as branch_name,
  br.id as brand_id,
  br.name as brand_name,
  coalesce(gs.total, 0) as sales,
  coalesce(fe.food_cost, 0) as food_cost,
  coalesce(fe.payroll, 0) as payroll,
  coalesce(fe.rent, 0) as rent,
  coalesce(fe.other, 0) as other,
  (coalesce(fe.food_cost, 0) + coalesce(fe.payroll, 0) + coalesce(fe.rent, 0) + coalesce(fe.other, 0)) as total_cost,
  (coalesce(gs.total, 0) - (coalesce(fe.food_cost, 0) + coalesce(fe.payroll, 0) + coalesce(fe.rent, 0) + coalesce(fe.other, 0))) as profit,
  (case when coalesce(gs.total, 0) > 0 then round(((coalesce(gs.total, 0) - (coalesce(fe.food_cost, 0) + coalesce(fe.payroll, 0) + coalesce(fe.rent, 0) + coalesce(fe.other, 0))) / coalesce(gs.total, 0)) * 100)::int else 0 end) as margin_pct
from public.branches b
join public.brands br on br.id = b.brand_id
left join public.geidea_sales gs on gs.branch_id = b.id
left join public.finance_entries fe on fe.branch_id = b.id;

create or replace view public.brand_pnl as
select
  br.id as brand_id,
  br.name as brand_name,
  sum(bp.sales) as sales,
  sum(bp.total_cost) as total_cost,
  sum(bp.profit) as profit,
  (case when sum(bp.sales) > 0 then round(((sum(bp.sales) - sum(bp.total_cost)) / sum(bp.sales)) * 100)::int else 0 end) as margin_pct
from public.branch_pnl bp
join public.brands br on br.id = bp.brand_id
group by br.id, br.name;

-- ============ RLS ============
alter table public.brands enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tables enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.recipes enable row level security;
alter table public.finance_entries enable row level security;
alter table public.geidea_sales enable row level security;
alter table public.geidea_imports enable row level security;
alter table public.customers enable row level security;
alter table public.customer_calls enable row level security;
alter table public.shifts enable row level security;
alter table public.attendance enable row level security;
alter table public.printer_settings enable row level security;
alter table public.security_logs enable row level security;

-- Helper: current user's brand (null for admins with no brand restriction).
create or replace function public.current_brand_id()
returns uuid language sql stable security definer set search_path = public as
  $$ select brand_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- Brands: members see their brand; admins see all.
drop policy if exists brands_select on public.brands;
create policy brands_select on public.brands for select
  using (public.is_admin() or id = public.current_brand_id());

drop policy if exists brands_insert on public.brands;
create policy brands_insert on public.brands for insert with check (public.is_admin());

drop policy if exists brands_update on public.brands;
create policy brands_update on public.brands for update using (public.is_admin()) with check (public.is_admin());

-- Branches: members see branches of their brand; admins see all.
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches for select
  using (public.is_admin() or brand_id = public.current_brand_id());

drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles: own row + admins see all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Generic brand-scoped tables: authenticated members of the brand have full access.
-- (Fine-grained per-role restrictions can be layered later; RLS still blocks cross-brand leaks.)
do $$
declare
  t text;
  tables text[] := array[
    'menu_items','orders','payments','expenses','recipes','finance_entries',
    'geidea_sales','geidea_imports','customers','customer_calls','shifts',
    'attendance','security_logs'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (public.is_admin() or brand_id = public.current_brand_id())', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (public.is_admin() or brand_id = public.current_brand_id())', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('create policy %I_update on public.%I for update using (public.is_admin() or brand_id = public.current_brand_id()) with check (public.is_admin() or brand_id = public.current_brand_id())', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_delete on public.%I for delete using (public.is_admin() or brand_id = public.current_brand_id())', t, t);
  end loop;
end $$;

-- order_items: via parent order's brand.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.brand_id = public.current_brand_id()));

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert
  with check (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.brand_id = public.current_brand_id()));

drop policy if exists order_items_update on public.order_items;
create policy order_items_update on public.order_items for update
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.brand_id = public.current_brand_id()));

drop policy if exists order_items_delete on public.order_items;
create policy order_items_delete on public.order_items for delete
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.brand_id = public.current_brand_id()));

-- tables / printer_settings: via branch's brand.
drop policy if exists tables_select on public.tables;
create policy tables_select on public.tables for select
  using (public.is_admin() or exists (select 1 from public.branches b where b.id = branch_id and b.brand_id = public.current_brand_id()));

drop policy if exists tables_write on public.tables;
create policy tables_write on public.tables for all
  using (public.is_admin() or exists (select 1 from public.branches b where b.id = branch_id and b.brand_id = public.current_brand_id()))
  with check (public.is_admin() or exists (select 1 from public.branches b where b.id = branch_id and b.brand_id = public.current_brand_id()));

drop policy if exists printer_settings_select on public.printer_settings;
create policy printer_settings_select on public.printer_settings for select
  using (public.is_admin() or exists (select 1 from public.branches b where b.id = branch_id and b.brand_id = public.current_brand_id()));

drop policy if exists printer_settings_write on public.printer_settings;
create policy printer_settings_write on public.printer_settings for all
  using (public.is_admin() or exists (select 1 from public.branches b where b.id = branch_id and b.brand_id = public.current_brand_id()))
  with check (public.is_admin() or exists (select 1 from public.branches b where b.id = branch_id and b.brand_id = public.current_brand_id()));

-- ============ Realtime (KDS / Pickup / Call Center) ============
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'customer_calls') then
    alter publication supabase_realtime add table public.customer_calls;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'payments') then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;

-- ============ Storage: receipts bucket ============
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists receipts_select on storage.objects;
create policy receipts_select on storage.objects for select
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');

drop policy if exists receipts_insert on storage.objects;
create policy receipts_insert on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

drop policy if exists receipts_update on storage.objects;
create policy receipts_update on storage.objects for update
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');

drop policy if exists receipts_delete on storage.objects;
create policy receipts_delete on storage.objects for delete
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');
