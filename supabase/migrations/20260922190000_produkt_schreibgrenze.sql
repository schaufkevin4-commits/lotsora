-- P2-3: nur versionierte Eintrittspunkte ändern Produktformular und Status.
begin;
create role lotsora_product_writer nologin inherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
-- Nur die interne Rolle erbt Nutzer-RLS; Nutzer/Authenticator erhalten diese Rolle NICHT.
grant authenticated to lotsora_product_writer;
grant lotsora_product_writer to postgres;
grant usage, create on schema public, private to lotsora_product_writer;

revoke update, truncate, references, trigger, maintain on public.products from public, anon, authenticated;
revoke insert, update, delete, truncate, references, trigger, maintain
  on public.product_materials, public.product_textile_data, public.product_sustainability
  from public, anon, authenticated;
grant update on public.products to lotsora_product_writer;
grant insert, update, delete on public.product_materials, public.product_textile_data,
  public.product_sustainability to lotsora_product_writer;

revoke execute on function public.save_product(uuid,text,text,text,text,public.product_status,jsonb,jsonb,jsonb),
  public.save_product_with_article(uuid,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text),
  public.replace_product_materials(uuid,jsonb), public.publish_product(uuid), public.withdraw_product(uuid)
  from public, anon, authenticated;
grant execute on function public.save_product(uuid,text,text,text,text,public.product_status,jsonb,jsonb,jsonb),
  public.save_product_with_article(uuid,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text),
  public.replace_product_materials(uuid,jsonb), public.publish_product(uuid), public.withdraw_product(uuid)
  to lotsora_product_writer;

-- Firmen- vor Produktsperre, wie Firmenlöschung. Die Mitgliedschaft selbst wird
-- mitgesperrt: auch ein alter REPEATABLE-READ-Snapshot darf Entzug nicht umgehen.
-- Dieser schmale private Helfer darf nur aus internen Funktionen aufgerufen werden.
create function private.lock_product_editor(p_product_id uuid) returns bigint
language plpgsql security definer set search_path='' as $$
declare company_uuid uuid; current_version bigint;
begin
  if auth.uid() is null or not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode='42501';
  end if;
  select manufacturer_id into company_uuid from public.products where id=p_product_id;
  perform 1 from public.manufacturers where id=company_uuid for share;
  if not found then raise exception 'Firma nicht gefunden.' using errcode='42501'; end if;
  perform 1 from public.manufacturer_memberships
    where manufacturer_id=company_uuid and user_id=auth.uid() for key share;
  if not found then raise exception 'Firmenzugriff wurde beendet.' using errcode='42501'; end if;
  select editor_version into current_version from public.products
    where id=p_product_id and manufacturer_id=company_uuid for update;
  if not found then raise exception 'Produkt nicht gefunden.' using errcode='42501'; end if;
  return current_version;
end $$;
revoke all on function private.lock_product_editor(uuid) from public, anon, authenticated;
grant execute on function private.lock_product_editor(uuid) to lotsora_product_writer;

create or replace function public.save_product_checked(
  p_product_id uuid, p_expected_version bigint, p_name text, p_description text,
  p_category text, p_brand text, p_expected_status public.product_status,
  p_materials jsonb, p_textile_data jsonb, p_sustainability jsonb, p_article_number text
) returns bigint language plpgsql security definer set search_path='' as $$
declare current_version bigint;
begin
  current_version := private.lock_product_editor(p_product_id);
  if current_version is distinct from p_expected_version then
    raise exception 'Produkt wurde inzwischen geändert.' using errcode='40001';
  end if;
  perform public.save_product_with_article(p_product_id,p_name,p_description,p_category,p_brand,
    p_expected_status,p_materials,p_textile_data,p_sustainability,p_article_number);
  select editor_version into current_version from public.products where id=p_product_id;
  return current_version;
end $$;
alter function public.save_product_checked(uuid,bigint,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text)
  owner to lotsora_product_writer;

create or replace function public.set_product_publication_checked(p_product_id uuid, p_expected_version bigint, p_publish boolean)
returns bigint language plpgsql security definer set search_path='' as $$
declare current_version bigint;
begin
  current_version := private.lock_product_editor(p_product_id);
  if current_version is distinct from p_expected_version then
    raise exception 'Produkt wurde inzwischen geändert.' using errcode='40001';
  end if;
  if p_publish is null then raise exception 'Veröffentlichungsauswahl fehlt.' using errcode='22023'; end if;
  if p_publish then perform public.publish_product(p_product_id);
  else perform public.withdraw_product(p_product_id); end if;
  select editor_version into current_version from public.products where id=p_product_id;
  return current_version;
end $$;
alter function public.set_product_publication_checked(uuid,bigint,boolean) owner to lotsora_product_writer;

-- Bilder behalten ihren eigenen Compare-and-swap-Vertrag. Direkte image_url-
-- Updates sind mit obigem Tabellenentzug ebenfalls nicht mehr möglich.
create or replace function public.set_product_image(p_product_id uuid, p_expected_path text, p_new_path text)
returns void language plpgsql security definer set search_path='' as $$
declare current_path text;
begin
  perform private.lock_product_editor(p_product_id);
  select image_url into current_path from public.products where id=p_product_id;
  if current_path is not distinct from p_new_path then return; end if;
  if current_path is distinct from p_expected_path then
    raise exception 'Produktbild inzwischen geändert.' using errcode='40001';
  end if;
  update public.products set image_url=p_new_path where id=p_product_id;
end $$;
alter function public.set_product_image(uuid,text,text) owner to lotsora_product_writer;

-- FK-Kaskaden bei regulärer Produktlöschung dürfen weiter die Elternzeile prüfen.
-- Der private Trigger ist kein öffentlicher Schreibweg und arbeitet weiter unter RLS.
alter function private.lock_material_products() security definer;
alter function private.lock_material_products() owner to lotsora_product_writer;
revoke all on function private.lock_material_products() from public,anon,authenticated;

revoke create on schema public, private from lotsora_product_writer;
revoke all on function public.save_product_checked(uuid,bigint,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text),
  public.set_product_publication_checked(uuid,bigint,boolean), public.set_product_image(uuid,text,text)
  from public,anon;
grant execute on function public.save_product_checked(uuid,bigint,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text),
  public.set_product_publication_checked(uuid,bigint,boolean), public.set_product_image(uuid,text,text)
  to authenticated;
commit;

