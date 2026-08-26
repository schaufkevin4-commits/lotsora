-- Storage für Produkt-Dokumente (Tag 23, Phase 5).
-- Setzt PP-015 (Supabase Storage) um. Zugriff nach PP-017/A-020:
-- nur der Hersteller, dem das Produkt gehört, darf Dateien lesen/schreiben.
-- Pfadkonvention: <product_id>/<datei>  → der erste Ordner ist die product_id.

-- 1) Privater Bucket (public=false → A-020: nichts ist automatisch öffentlich).
insert into storage.buckets (id, name, public)
values ('produkt-dokumente', 'produkt-dokumente', false)
on conflict (id) do nothing;

-- 2) RLS-Policies auf storage.objects – gespiegelt zur documents-Tabelle.
create policy "Dok-Datei: eigene lesen"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'produkt-dokumente'
    and public.owns_product(((storage.foldername(name))[1])::uuid)
  );

create policy "Dok-Datei: eigene anlegen"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'produkt-dokumente'
    and public.owns_product(((storage.foldername(name))[1])::uuid)
  );

create policy "Dok-Datei: eigene aendern"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'produkt-dokumente'
    and public.owns_product(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'produkt-dokumente'
    and public.owns_product(((storage.foldername(name))[1])::uuid)
  );

create policy "Dok-Datei: eigene loeschen"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'produkt-dokumente'
    and public.owns_product(((storage.foldername(name))[1])::uuid)
  );