-- F01: Ein Dokument darf nur eine Datei im Ordner seines eigenen Produkts nennen.
-- Validiert Altbestände ohne stilles Löschen/Umschreiben: abweichende Altpfade
-- blockieren die Migration und müssen vor deren Anwendung geprüft werden.
alter table public.documents add constraint documents_file_path_matches_product
  check (file_path is null or file_path ~ ('^' || product_id::text || '/[A-Za-z0-9._-]+$'));

-- Neue/veränderte Dateiverweise müssen auf ein bereits hochgeladenes Objekt zeigen.
-- Metadaten und Rücknahme bleiben bei einer später fehlenden Datei bearbeitbar.
create function private.check_document_storage_object()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.file_path is not null and (
    tg_op = 'INSERT'
    or new.file_path is distinct from old.file_path
    or new.product_id is distinct from old.product_id
  ) then
    if not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'produkt-dokumente' and o.name = new.file_path
    ) then
      raise exception 'Dokumentdatei fehlt im privaten Produktspeicher.' using errcode = '23503';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.check_document_storage_object() from public, anon, authenticated;

create trigger documents_check_storage_object
  before insert or update of file_path, product_id on public.documents
  for each row execute function private.check_document_storage_object();

-- Zusätzliche Prüfung beim öffentlichen Dateizugriff, unabhängig vom Schreibpfad.
alter policy "Dok-Datei: freigegebene oeffentlich lesen"
  on storage.objects
  using (
    bucket_id = 'produkt-dokumente'
    and exists (
      select 1 from public.documents d
      join public.products p on p.id = d.product_id
      where d.file_path = storage.objects.name
        and storage.objects.name ~ ('^' || d.product_id::text || '/[A-Za-z0-9._-]+$')
        and d.visibility = 'oeffentlich'
        and p.status = 'veroeffentlicht'
    )
  );

-- Interne Notizen bleiben privat, auch bei ausdrücklich freigegebener Datei.
revoke select on public.documents from anon;
grant select (id, product_id, name, doc_type, file_path, visibility, uploaded_at)
  on public.documents to anon;
