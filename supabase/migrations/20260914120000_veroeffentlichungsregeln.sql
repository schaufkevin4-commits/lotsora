-- B4/F03: Regeln gelten auch für direkte API-/SQL-Schreibwege.
-- Bestehende ungültige Daten blockieren die Migration; keine stille Korrektur.
-- Alle Statements müssen gemeinsam als Migration angewendet werden.
lock table public.products, public.product_materials in share row exclusive mode;

alter table public.products add constraint products_published_required_fields check (
  status <> 'veroeffentlicht' or (
    name ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    and description ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    and category ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
  )
);

alter table public.product_materials
  alter column percentage set not null,
  add constraint product_materials_name_not_blank check (material_name ~ '[^[:space:]]');

do $$
begin
  if exists (
    select product_id from public.product_materials
    group by product_id having sum(percentage) > 100
  ) then
    raise exception 'Bestehende Materialsumme über 100%%: Bestand vor Migration prüfen.'
      using errcode = '23514';
  end if;
end;
$$;

-- Jede Materialänderung schreibt auch die Elternzeile. Das serialisiert die
-- Summe pro Produkt, auch unter REPEATABLE READ (sonst bleibt ein alter Snapshot).
-- RLS bleibt aktiv. Bei kaskadierter Produktlöschung existiert der Elternsatz
-- nicht mehr; dann ist kein Update nötig. Zwei betroffene Produkte geordnet sperren.
create function private.lock_material_products()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_id uuid;
  next_id uuid;
  product_id_to_lock uuid;
begin
  if tg_op <> 'INSERT' then previous_id := old.product_id; end if;
  if tg_op <> 'DELETE' then next_id := new.product_id; end if;
  for product_id_to_lock in
    select distinct id from unnest(array[previous_id, next_id]) as ids(id)
    where id is not null order by id
  loop
    update public.products set updated_at = updated_at where id = product_id_to_lock;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.lock_material_products() from public, anon, authenticated;

create trigger product_materials_lock_product
  before insert or update or delete on public.product_materials
  for each row execute function private.lock_material_products();

-- Erst den endgültigen Transaktionsstand prüfen, damit Replace-all und
-- mehrzeilige Umverteilungen nicht an vorübergehenden Zwischensummen scheitern.
-- SECURITY DEFINER liest die vollständige Summe auch bei geänderter Zuordnung;
-- der private Trigger gibt keine Daten zurück und erlaubt keinen API-Aufruf.
create function private.check_material_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_id uuid;
  next_id uuid;
begin
  if tg_op <> 'INSERT' then previous_id := old.product_id; end if;
  if tg_op <> 'DELETE' then next_id := new.product_id; end if;
  if exists (
    select product_id from public.product_materials
    where product_id in (previous_id, next_id)
    group by product_id having sum(percentage) > 100
  ) then
    raise exception 'Die Materialanteile ergeben mehr als 100%%.'
      using errcode = '23514', constraint = 'product_materials_total_limit';
  end if;
  return null;
end;
$$;
revoke all on function private.check_material_total() from public, anon, authenticated;

create constraint trigger product_materials_total_limit
  after insert or update or delete on public.product_materials
  deferrable initially deferred
  for each row execute function private.check_material_total();

-- Statuswechsel und Prüfung sind eine Transaktion unter derselben Produktsperre.
create function public.publish_product(p_product_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  update public.products set status = 'veroeffentlicht' where id = p_product_id;
end;
$$;
revoke all on function public.publish_product(uuid) from public, anon;
grant execute on function public.publish_product(uuid) to authenticated;

create function public.withdraw_product(p_product_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  update public.products set status = case
    when name ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
      and description ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
      and category ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    then 'entwurf'::public.product_status
    else 'unvollstaendig'::public.product_status end
  where id = p_product_id;
end;
$$;
revoke all on function public.withdraw_product(uuid) from public, anon;
grant execute on function public.withdraw_product(uuid) to authenticated;

create or replace function public.replace_product_materials(
  p_product_id uuid,
  p_materials jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  material jsonb;
  anteil numeric;
  summe numeric := 0;
begin
  if not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.'
      using errcode = '42501';
  end if;

  -- Vor DELETE/INSERT sperren; auch zwei Replace-all-Aufrufe sind geordnet.
  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_materials) is distinct from 'array' then
    raise exception 'Materialien müssen als Liste übergeben werden.'
      using errcode = '22023';
  end if;

  for material in select value from jsonb_array_elements(p_materials)
  loop
    if jsonb_typeof(material) is distinct from 'object'
      or jsonb_typeof(material -> 'material_name') is distinct from 'string'
      or btrim(material ->> 'material_name') = ''
      or jsonb_typeof(material -> 'percentage') is distinct from 'number'
    then
      raise exception 'Ungültiger Materialeintrag.'
        using errcode = '22023';
    end if;

    anteil := (material ->> 'percentage')::numeric;
    if anteil < 0 or anteil > 100 then
      raise exception 'Jeder Materialanteil muss zwischen 0 und 100 liegen.'
        using errcode = '23514';
    end if;

    summe := summe + round(anteil, 2);
  end loop;

  if round(summe, 2) > 100 then
    raise exception 'Die Materialanteile ergeben mehr als 100%%.'
      using errcode = '23514';
  end if;

  delete from public.product_materials
  where product_id = p_product_id;

  insert into public.product_materials (product_id, material_name, percentage)
  select
    p_product_id,
    btrim(element.value ->> 'material_name'),
    (element.value ->> 'percentage')::numeric
  from jsonb_array_elements(p_materials) as element(value);
end;
$$;

revoke execute on function public.replace_product_materials(uuid, jsonb) from public;
grant execute on function public.replace_product_materials(uuid, jsonb) to authenticated;

-- Neuer Vertrag: erwarteten Lesestatus übergeben, keinen Zielstatus.
-- Alte API-Aufrufe schlagen sichtbar fehl, statt still ihren Status umzudeuten.
drop function public.save_product(uuid, text, text, text, text, public.product_status, jsonb, jsonb, jsonb);
create function public.save_product(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_category text,
  p_brand text,
  p_expected_status public.product_status,
  p_materials jsonb,
  p_textile_data jsonb,
  p_sustainability jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_status public.product_status;
  next_status public.product_status;
begin
  if not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.'
      using errcode = '42501';
  end if;

  select status into current_status from public.products
  where id = p_product_id for update;
  if not found then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  if current_status is distinct from p_expected_status then
    raise exception 'Produktstatus wurde inzwischen geändert. Bitte neu laden und erneut speichern.'
      using errcode = '40001';
  end if;
  next_status := case
    when current_status = 'veroeffentlicht' then current_status
    when p_name ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
      and p_description ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
      and p_category ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    then 'entwurf'::public.product_status
    else 'unvollstaendig'::public.product_status end;

  if p_textile_data is not null
    and jsonb_typeof(p_textile_data) not in ('object', 'null')
  then
    raise exception 'Textildaten müssen als Objekt oder null übergeben werden.'
      using errcode = '22023';
  end if;

  if p_sustainability is not null
    and jsonb_typeof(p_sustainability) not in ('object', 'null')
  then
    raise exception 'Nachhaltigkeitsdaten müssen als Objekt oder null übergeben werden.'
      using errcode = '22023';
  end if;

  update public.products
  set
    name = p_name,
    description = p_description,
    category = p_category,
    brand = nullif(p_brand, ''),
    status = next_status
  where id = p_product_id;

  -- Nutzt weiterhin das bestehende, RLS-geschützte atomare Replace-all.
  perform public.replace_product_materials(p_product_id, p_materials);

  if p_textile_data is null
    or jsonb_typeof(p_textile_data) = 'null'
    or (
      coalesce(p_textile_data ->> 'origin_country', '') = ''
      and coalesce(p_textile_data ->> 'color', '') = ''
      and coalesce(p_textile_data ->> 'size', '') = ''
      and coalesce(p_textile_data ->> 'care_instructions', '') = ''
      and coalesce(p_textile_data ->> 'wash_instructions', '') = ''
    )
  then
    delete from public.product_textile_data
    where product_id = p_product_id;
  else
    insert into public.product_textile_data (
      product_id,
      origin_country,
      color,
      size,
      care_instructions,
      wash_instructions
    )
    values (
      p_product_id,
      p_textile_data ->> 'origin_country',
      p_textile_data ->> 'color',
      p_textile_data ->> 'size',
      p_textile_data ->> 'care_instructions',
      p_textile_data ->> 'wash_instructions'
    )
    on conflict (product_id) do update
    set
      origin_country = excluded.origin_country,
      color = excluded.color,
      size = excluded.size,
      care_instructions = excluded.care_instructions,
      wash_instructions = excluded.wash_instructions;
  end if;

  if p_sustainability is null
    or jsonb_typeof(p_sustainability) = 'null'
    or (
      coalesce(p_sustainability ->> 'recycling_notes', '') = ''
      and coalesce(p_sustainability ->> 'repair_notes', '') = ''
      and coalesce(p_sustainability ->> 'disposal_notes', '') = ''
      and coalesce(p_sustainability ->> 'reusable_materials', '') = ''
    )
  then
    delete from public.product_sustainability
    where product_id = p_product_id;
  else
    insert into public.product_sustainability (
      product_id,
      recycling_notes,
      repair_notes,
      disposal_notes,
      reusable_materials
    )
    values (
      p_product_id,
      p_sustainability ->> 'recycling_notes',
      p_sustainability ->> 'repair_notes',
      p_sustainability ->> 'disposal_notes',
      p_sustainability ->> 'reusable_materials'
    )
    on conflict (product_id) do update
    set
      recycling_notes = excluded.recycling_notes,
      repair_notes = excluded.repair_notes,
      disposal_notes = excluded.disposal_notes,
      reusable_materials = excluded.reusable_materials;
  end if;
end;
$$;

revoke execute on function public.save_product(
  uuid,
  text,
  text,
  text,
  text,
  public.product_status,
  jsonb,
  jsonb,
  jsonb
) from public;

grant execute on function public.save_product(
  uuid,
  text,
  text,
  text,
  text,
  public.product_status,
  jsonb,
  jsonb,
  jsonb
) to authenticated;
