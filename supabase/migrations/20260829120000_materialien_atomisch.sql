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
