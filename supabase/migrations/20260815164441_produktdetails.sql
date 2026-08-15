-- Materialien (1:n) — mehrere pro Produkt
create table public.product_materials (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  material_name text not null,
  percentage    numeric(5,2) check (percentage >= 0 and percentage <= 100),
  created_at    timestamptz not null default now()
);
create index product_materials_product_id_idx on public.product_materials (product_id);

-- Textildaten (1:1) — product_id ist Primärschlüssel = max. eine Zeile pro Produkt
create table public.product_textile_data (
  product_id        uuid primary key references public.products (id) on delete cascade,
  origin_country    text,   -- Herkunftsland
  color             text,   -- Farbe
  size              text,   -- Größenangaben
  care_instructions text,   -- Pflegehinweise
  wash_instructions text    -- Waschhinweise
);

-- Nachhaltigkeitsdaten (1:1)
create table public.product_sustainability (
  product_id         uuid primary key references public.products (id) on delete cascade,
  recycling_notes    text,   -- Recyclinghinweise
  repair_notes       text,   -- Reparaturhinweise
  reusable_materials text,   -- Wiederverwendbare Materialien
  disposal_notes     text    -- Entsorgungshinweise
);

-- RLS von Tag 1 — Zugriff nur, wenn das übergeordnete Produkt dem Nutzer gehört
alter table public.product_materials     enable row level security;
alter table public.product_textile_data  enable row level security;
alter table public.product_sustainability enable row level security;

-- Materialien
create policy "Material: eigene lesen"    on public.product_materials for select to authenticated using (owns_product(product_id));
create policy "Material: eigene anlegen"  on public.product_materials for insert to authenticated with check (owns_product(product_id));
create policy "Material: eigene aendern"  on public.product_materials for update to authenticated using (owns_product(product_id)) with check (owns_product(product_id));
create policy "Material: eigene loeschen" on public.product_materials for delete to authenticated using (owns_product(product_id));

-- Textildaten
create policy "Textil: eigene lesen"    on public.product_textile_data for select to authenticated using (owns_product(product_id));
create policy "Textil: eigene anlegen"  on public.product_textile_data for insert to authenticated with check (owns_product(product_id));
create policy "Textil: eigene aendern"  on public.product_textile_data for update to authenticated using (owns_product(product_id)) with check (owns_product(product_id));
create policy "Textil: eigene loeschen" on public.product_textile_data for delete to authenticated using (owns_product(product_id));

-- Nachhaltigkeit
create policy "Nachhaltigkeit: eigene lesen"    on public.product_sustainability for select to authenticated using (owns_product(product_id));
create policy "Nachhaltigkeit: eigene anlegen"  on public.product_sustainability for insert to authenticated with check (owns_product(product_id));
create policy "Nachhaltigkeit: eigene aendern"  on public.product_sustainability for update to authenticated using (owns_product(product_id)) with check (owns_product(product_id));
create policy "Nachhaltigkeit: eigene loeschen" on public.product_sustainability for delete to authenticated using (owns_product(product_id));