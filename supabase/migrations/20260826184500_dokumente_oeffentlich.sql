-- Öffentliche Dokumentfreigabe (Tag 24, PP-013 E7 / PP-017 / A-020).
-- Der Bucket bleibt privat. Anonyme Leser erhalten nur Zugriff, wenn
--   1) das Produkt veröffentlicht ist und
--   2) das Dokument aktiv auf "oeffentlich" gesetzt wurde.

-- Für die Statusprüfung darf anon nur ID + Status veröffentlichter Produkte
-- lesen. Weitere öffentliche Produktfelder folgen mit der Produktpass-Seite.
grant select (id, status) on public.products to anon;

create policy "Produkte: veroeffentlichte oeffentlich lesen"
  on public.products for select to anon
  using (status = 'veroeffentlicht');

grant select on public.documents to anon;

create policy "Dokument: freigegebene oeffentlich lesen"
  on public.documents for select to anon
  using (
    visibility = 'oeffentlich'
    and exists (
      select 1
      from public.products p
      where p.id = documents.product_id
        and p.status = 'veroeffentlicht'
    )
  );

create policy "Dok-Datei: freigegebene oeffentlich lesen"
  on storage.objects for select to anon
  using (
    bucket_id = 'produkt-dokumente'
    and exists (
      select 1
      from public.documents d
      join public.products p on p.id = d.product_id
      where d.file_path = storage.objects.name
        and d.visibility = 'oeffentlich'
        and p.status = 'veroeffentlicht'
    )
  );
