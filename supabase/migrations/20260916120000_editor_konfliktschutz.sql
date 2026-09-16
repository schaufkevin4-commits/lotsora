begin;

-- Bearbeitungstoken für Formular + Status, keine Veröffentlichungsrevision.
alter table public.products add column editor_version bigint not null default 0;

create function private.advance_editor_version()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if row(new.name,new.description,new.category,new.brand,new.article_number,new.status)
      is distinct from row(old.name,old.description,old.category,old.brand,old.article_number,old.status)
      or new.editor_version is distinct from old.editor_version then
    new.editor_version := old.editor_version + 1;
  end if;
  return new;
end $$;
revoke all on function private.advance_editor_version() from public, anon, authenticated;
create trigger products_editor_version before update on public.products
  for each row execute function private.advance_editor_version();

-- Die vorhandene B4-Sperre bleibt erhalten und umfasst nun alle Formularbereiche.
create or replace function private.lock_material_products()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare previous_id uuid; next_id uuid; product_id_to_lock uuid;
begin
  if tg_op <> 'INSERT' then previous_id := old.product_id; end if;
  if tg_op <> 'DELETE' then next_id := new.product_id; end if;
  for product_id_to_lock in
    select distinct id from unnest(array[previous_id,next_id]) as ids(id)
    where id is not null order by id
  loop
    update public.products set editor_version = editor_version + 1 where id = product_id_to_lock;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger product_textile_data_lock_product before insert or update or delete on public.product_textile_data
  for each row execute function private.lock_material_products();
create trigger product_sustainability_lock_product before insert or update or delete on public.product_sustainability
  for each row execute function private.lock_material_products();

create function public.save_product_checked(
  p_product_id uuid, p_expected_version bigint, p_name text, p_description text,
  p_category text, p_brand text, p_expected_status public.product_status,
  p_materials jsonb, p_textile_data jsonb, p_sustainability jsonb, p_article_number text
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare current_version bigint;
begin
  if not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  select editor_version into current_version from public.products where id = p_product_id for update;
  if not found then raise exception 'Produkt nicht gefunden.' using errcode = '42501'; end if;
  if current_version is distinct from p_expected_version then
    raise exception 'Produkt wurde inzwischen geändert.' using errcode = '40001';
  end if;
  perform public.save_product_with_article(p_product_id,p_name,p_description,p_category,p_brand,
    p_expected_status,p_materials,p_textile_data,p_sustainability,p_article_number);
  select editor_version into current_version from public.products where id = p_product_id;
  return current_version;
end $$;
revoke all on function public.save_product_checked(uuid,bigint,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text) from public, anon;
grant execute on function public.save_product_checked(uuid,bigint,text,text,text,text,public.product_status,jsonb,jsonb,jsonb,text) to authenticated;

create function public.set_product_publication_checked(p_product_id uuid, p_expected_version bigint, p_publish boolean)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare current_version bigint;
begin
  if not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  select editor_version into current_version from public.products where id = p_product_id for update;
  if not found then raise exception 'Produkt nicht gefunden.' using errcode = '42501'; end if;
  if current_version is distinct from p_expected_version then
    raise exception 'Produkt wurde inzwischen geändert.' using errcode = '40001';
  end if;
  if p_publish then perform public.publish_product(p_product_id);
  else perform public.withdraw_product(p_product_id); end if;
  select editor_version into current_version from public.products where id = p_product_id;
  return current_version;
end $$;
revoke all on function public.set_product_publication_checked(uuid,bigint,boolean) from public, anon;
grant execute on function public.set_product_publication_checked(uuid,bigint,boolean) to authenticated;
commit;
