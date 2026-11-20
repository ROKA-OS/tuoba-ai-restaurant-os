-- TUOBA Restaurant OS — seed data (mirrors app.js BRANDS/MENU/finance defaults)
-- Run AFTER schema.sql. Idempotent (upserts).

insert into public.brands (name) values
  ('TUOBA Fried & Grill'),
  ('TUOBA Cafe'),
  ('TUOBA Express')
on conflict (name) do nothing;

insert into public.branches (brand_id, name)
select b.id, x.name
from public.brands b
join (values
  ('TUOBA Fried & Grill', 'Giza Main'),
  ('TUOBA Fried & Grill', 'Nasr City'),
  ('TUOBA Cafe', 'Sheikh Zayed'),
  ('TUOBA Cafe', 'New Cairo'),
  ('TUOBA Express', 'Alexandria')
) as x(brand_name, name) on x.brand_name = b.name
on conflict (brand_id, name) do nothing;

-- Menu (brand: TUOBA Fried & Grill)
insert into public.menu_items (brand_id, name_ar, name_en, name_fr, name_es, name_tr, price, prep_minutes)
select b.id, v.ar, v.en, v.fr, v.es, v.tr, v.price, v.prep
from public.brands b
join (values
  ('برجر دجاج', 'Chicken Burger', 'Burger Poulet', 'Hamburguesa de pollo', 'Tavuk Burger', 85, 12),
  ('برجر لحم', 'Beef Burger', 'Burger Boeuf', 'Hamburguesa de carne', 'Et Burger', 95, 14),
  ('وجبة استربس', 'Strips Meal', 'Menu Strips', 'Combo Strips', 'Strips Menü', 120, 15),
  ('فرايز', 'Fries', 'Frites', 'Papas fritas', 'Patates', 35, 6),
  ('كولا', 'Cola', 'Cola', 'Cola', 'Kola', 25, 1),
  ('قهوة', 'Coffee', 'Café', 'Café', 'Kahve', 45, 4)
) as v(ar, en, fr, es, tr, price, prep) on true
where b.name = 'TUOBA Fried & Grill'
  and not exists (select 1 from public.menu_items m where m.brand_id = b.id and m.name_en = v.en);

-- Shifts
insert into public.shifts (brand_id, name, start_time, end_time)
select b.id, v.name, v.start_time::time, v.end_time::time
from public.brands b
join (values ('Morning', '09:00', '18:00'), ('Evening', '14:00', '23:00')) as v(name, start_time, end_time) on true
on conflict (brand_id, name) do nothing;

-- Finance defaults
insert into public.finance_entries (brand_id, branch_id, food_cost, payroll, rent, other)
select br.id, brn.id, v.food, v.payroll, v.rent, v.other
from (values
  ('TUOBA Fried & Grill', 'Giza Main', 168000, 95000, 40000, 32000),
  ('TUOBA Fried & Grill', 'Nasr City', 120000, 70000, 35000, 25000),
  ('TUOBA Cafe', 'Sheikh Zayed', 90000, 65000, 42000, 22000),
  ('TUOBA Cafe', 'New Cairo', 85000, 60000, 40000, 21000),
  ('TUOBA Express', 'Alexandria', 70000, 50000, 30000, 18000)
) as v(brand_name, branch_name, food, payroll, rent, other)
join public.brands br on br.name = v.brand_name
join public.branches brn on brn.brand_id = br.id and brn.name = v.branch_name
on conflict (brand_id, branch_id) do nothing;

-- Tables T1..T6 per branch
insert into public.tables (branch_id, label)
select brn.id, t.label
from public.branches brn
join (values ('T1'), ('T2'), ('T3'), ('T4'), ('T5'), ('T6')) as t(label) on true
on conflict (branch_id, label) do nothing;

-- Printer defaults per branch
insert into public.printer_settings (branch_id, cashier_copies, kitchen_copies, pickup_copies)
select brn.id, 1, 1, 1
from public.branches brn
on conflict (branch_id) do nothing;
