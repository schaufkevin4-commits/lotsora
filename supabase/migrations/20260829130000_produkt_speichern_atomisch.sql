create or replace function public.save_product(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_category text,
  p_brand text,
  p_status public.product_status,
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
  material jsonb;
  anteil numeric;
  summe numeric := 0;
begin
  if not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.'
      using errcode = '42501';
  end if;

  -- Vor dem ersten Write dieselben Materialregeln wie im bestehenden RPC prüfen.
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

    summe := summe + anteil;
  end loop;

  if round(summe, 2) > 100 then
    raise exception 'Die Materialanteile ergeben mehr als 100%%.'
      using errcode = '23514';
  end if;

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
    status = p_status
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
