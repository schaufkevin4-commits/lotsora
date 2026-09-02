-- Öffentliche Produktpass-Seite (Tag 27, PP-013 E1/E4 / PP-017 / A-020).
-- Baut auf Tag 24 (dokumente_oeffentlich) auf: dort bekam anon bereits Lesezugriff
-- auf id+status veröffentlichter Produkte und auf freigegebene Dokumente.
-- Tag 27 öffnet jetzt die restlichen ÖFFENTLICHEN Felder (PP-013 E1) für anon:
-- Produkt-Restfelder, Material, Textildaten, Nachhaltigkeit und die drei
-- öffentlichen Herstellerfelder. Sensible Felder (Kontaktperson, E-Mail, Telefon,
-- Adresse, Artikelnr./SKU/GTIN, manufacturer_id) bleiben zu. Bucket bleibt privat.

-- --- Helfer (SECURITY DEFINER, analog owns_product): umgehen sauber die
--     anon-Spaltenrechte/RLS in den Policy-Subqueries, keine Rekursion. --------

create or replace function public.produkt_ist_veroeffentlicht(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.products p
    where p.id = p_product
      and p.status = 'veroeffentlicht'
  );
$$;

create or replace function public.hersteller_hat_veroeffentlichtes_produkt(p_manufacturer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.products p
    where p.manufacturer_id = p_manufacturer
      and p.status = 'veroeffentlicht'
  );
$$;

-- --- products: die übrigen öffentlichen Spalten für anon (PP-013 E1). --------
--     Zeilenzugriff regelt bereits die Tag-24-Policy; hier nur Spaltenrechte.
grant select (name, description, category, brand, image_url, updated_at)
  on public.products to anon;

-- --- manufacturers: nur Firmenname, Land, Website (PP-013 E1). ---------------
grant select (id, company_name, country, website)
  on public.manufacturers to anon;

create policy "Hersteller: oeffentlich bei veroeffentlichtem Produkt"
  on public.manufacturers for select to anon
  using (public.hersteller_hat_veroeffentlichtes_produkt(id));

-- --- Material / Textil / Nachhaltigkeit: alle Spalten öffentlich (keine
--     personenbezogenen Daten), Zeile nur bei veröffentlichtem Produkt. -------
grant select on public.product_materials     to anon;
grant select on public.product_textile_data  to anon;
grant select on public.product_sustainability to anon;

create policy "Material: oeffentlich bei veroeffentlichtem Produkt"
  on public.product_materials for select to anon
  using (public.produkt_ist_veroeffentlicht(product_id));

create policy "Textil: oeffentlich bei veroeffentlichtem Produkt"
  on public.product_textile_data for select to anon
  using (public.produkt_ist_veroeffentlicht(product_id));

create policy "Nachhaltigkeit: oeffentlich bei veroeffentlichtem Produkt"
  on public.product_sustainability for select to anon
  using (public.produkt_ist_veroeffentlicht(product_id));