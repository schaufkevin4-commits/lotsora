-- B5/N7: private, unveränderliche Uploads vor Verwendung inhaltlich prüfen.
lock table public.products, public.documents, public.file_operations in share row exclusive mode;
alter table public.file_operations
  add column purpose text not null default 'document' check (purpose in ('document', 'image')),
  add column validation_started_at timestamptz,
  add column validated boolean not null default false;
-- Bestehende Dokumente behalten ihren bisherigen Vertrag. Vor Übernahme muss
-- der Altbestand separat geprüft werden; dies ist keine rückwirkende Inhaltsprüfung.
update public.file_operations set validated = true, validation_started_at = now() where state = 'attached';
do $$ begin
  if exists(select 1 from public.products where image_url is not null) then
    raise exception 'Vorhandene image_url-Werte vor Einführung verwalteter Bilder prüfen.' using errcode = '23514';
  end if;
end $$;
alter table public.products add constraint products_article_number_length check (length(article_number) <= 120);
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  where id = 'produkt-dokumente';

create function public.reserve_file_upload(p_product_id uuid, p_file_name text, p_purpose text)
returns public.file_operations language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations;
begin
  if p_purpose is null or p_purpose not in ('document', 'image') then raise exception 'Ungültiger Dateizweck.' using errcode = '22023'; end if;
  operation := public.reserve_document_upload(p_product_id, p_file_name);
  update public.file_operations set purpose = p_purpose where id = operation.id returning * into operation;
  return operation;
end $$;
revoke all on function public.reserve_file_upload(uuid,text,text) from public, anon;
grant execute on function public.reserve_file_upload(uuid,text,text) to authenticated;

create or replace function public.can_write_product_file(p_path text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare operation public.file_operations; owner_uuid uuid;
begin
  select * into operation from public.file_operations where file_path = p_path;
  if not found or operation.owner_id is distinct from auth.uid() then return false; end if;
  select m.user_id into owner_uuid from public.products p join public.manufacturers m on m.id = p.manufacturer_id
    where p.id = operation.product_id for update of p;
  if not found or owner_uuid is distinct from auth.uid() then return false; end if;
  select * into operation from public.file_operations where file_path = p_path for update;
  return operation.state = 'uploading' and operation.validation_started_at is null;
end $$;
-- Kein Überschreiben/Umbenennen: auch nach Prüfung bleiben die Bytes unverändert.
drop policy "Dok-Datei: eigene aendern" on storage.objects;

create function public.begin_file_validation(p_operation_id uuid)
returns public.file_operations language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id;
  if not found or operation.owner_id is distinct from auth.uid() then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
  perform 1 from public.products where id = operation.product_id for update;
  if not found then raise exception 'Produkt entfernt.' using errcode = '23514'; end if;
  select * into operation from public.file_operations where id = p_operation_id for update;
  if operation.state not in ('uploading', 'attached') then raise exception 'Dateivorgang beendet.' using errcode = '23514'; end if;
  update public.file_operations set validation_started_at = coalesce(validation_started_at, now())
    where id = p_operation_id returning * into operation;
  return operation;
end $$;
revoke all on function public.begin_file_validation(uuid) from public, anon;
grant execute on function public.begin_file_validation(uuid) to authenticated;

-- Ausschließlich der Server darf das Ergebnis seiner Inhaltsprüfung bestätigen.
create function public.mark_file_validated(p_operation_id uuid, p_owner_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id for update;
  if not found or operation.owner_id is distinct from p_owner_id then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
  if operation.state not in ('uploading','attached') or operation.validation_started_at is null then
    raise exception 'Datei nicht zur Prüfung gesperrt.' using errcode = '23514';
  end if;
  if not exists(select 1 from storage.objects where bucket_id = 'produkt-dokumente' and name = operation.file_path) then
    raise exception 'Datei fehlt.' using errcode = '23514';
  end if;
  update public.file_operations set validated = true where id = p_operation_id;
end $$;
revoke all on function public.mark_file_validated(uuid,uuid) from public, anon, authenticated;
grant execute on function public.mark_file_validated(uuid,uuid) to service_role;

create function private.require_validated_document_file()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.file_path is not null and not exists(select 1 from public.file_operations
    where file_path = new.file_path and product_id = new.product_id and validated and purpose = 'document') then
    raise exception 'Dokumentdatei wurde noch nicht geprüft.' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function private.require_validated_document_file() from public, anon, authenticated;
create trigger documents_require_validated_file before insert or update on public.documents
  for each row execute function private.require_validated_document_file();

create function private.manage_product_image()
returns trigger language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations;
begin
  if new.image_url is not null then
    select * into operation from public.file_operations where file_path = new.image_url for update;
    if not found or operation.product_id <> new.id or operation.purpose <> 'image' or not operation.validated
      or operation.state not in ('uploading','attached') then
      raise exception 'Produktbild nicht verfügbar oder ungeprüft.' using errcode = '23514';
    end if;
    if not exists(select 1 from storage.objects where bucket_id = 'produkt-dokumente' and name = new.image_url) then
      raise exception 'Produktbild fehlt.' using errcode = '23514';
    end if;
    update public.file_operations set state = 'attached', last_error = null where id = operation.id;
  end if;
  if tg_op = 'UPDATE' and old.image_url is distinct from new.image_url and old.image_url is not null then
    update public.file_operations set state = 'cleanup', reason = 'document_delete' where file_path = old.image_url and state <> 'deleted';
  end if;
  return new;
end $$;
revoke all on function private.manage_product_image() from public, anon, authenticated;
create trigger products_manage_image before insert or update of image_url on public.products
  for each row execute function private.manage_product_image();

create function public.set_product_image(p_product_id uuid, p_expected_path text, p_new_path text)
returns void language plpgsql security invoker set search_path = '' as $$
declare current_path text;
begin
  if not public.owns_product(p_product_id) then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
  select image_url into current_path from public.products where id = p_product_id for update;
  if not found then raise exception 'Produkt entfernt.' using errcode = '42501'; end if;
  if current_path is not distinct from p_new_path then return; end if;
  if current_path is distinct from p_expected_path then raise exception 'Produktbild inzwischen geändert.' using errcode = '40001'; end if;
  update public.products set image_url = p_new_path where id = p_product_id;
end $$;
revoke all on function public.set_product_image(uuid,text,text) from public, anon;
grant execute on function public.set_product_image(uuid,text,text) to authenticated;

-- Direkte Dateifreigabe nur für das aktuelle Bild eines veröffentlichten Produkts.
create policy "Produktbild: veroeffentlicht lesen" on storage.objects for select to anon, authenticated
  using (bucket_id = 'produkt-dokumente' and exists(select 1 from public.products
    where image_url = name and status = 'veroeffentlicht'));

-- Der bestehende Vier-Tabellen-Save und die Artikelnummer bleiben eine Transaktion.
create function public.save_product_with_article(
  p_product_id uuid, p_name text, p_description text, p_category text, p_brand text,
  p_expected_status public.product_status, p_materials jsonb, p_textile_data jsonb,
  p_sustainability jsonb, p_article_number text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform public.save_product(p_product_id,p_name,p_description,p_category,p_brand,p_expected_status,p_materials,p_textile_data,p_sustainability);
  update public.products set article_number = nullif(btrim(p_article_number), '') where id = p_product_id;
end $$;
revoke all on function public.save_product_with_article(uuid,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text) from public, anon;
grant execute on function public.save_product_with_article(uuid,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text) to authenticated;
