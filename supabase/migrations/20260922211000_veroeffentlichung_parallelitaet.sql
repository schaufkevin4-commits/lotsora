-- Auch Dokument-/Firmenänderungen müssen einen bereits laufenden Snapshot
-- invalidieren. Das Formulartoken bleibt separat; eigene Dateiaktionen machen
-- unveränderte Formulare nicht künstlich veraltet.
begin;
create function private.touch_publication_product() returns trigger
language plpgsql security definer set search_path='' as $$
declare prior_id uuid; next_id uuid; target uuid;
begin
  if tg_op<>'INSERT' then prior_id:=old.product_id; end if;
  if tg_op<>'DELETE' then next_id:=new.product_id; end if;
  for target in select distinct id from unnest(array[prior_id,next_id]) ids(id) where id is not null order by id loop
    update public.products set updated_at=updated_at where id=target;
  end loop;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.touch_publication_product() from public,anon,authenticated;
create trigger documents_publication_clock before insert or update or delete on public.documents
  for each row execute function private.touch_publication_product();

create function private.touch_company_publications() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
  if row(new.company_name,new.country,new.website) is distinct from row(old.company_name,old.country,old.website) then
    for target in select id from public.products where manufacturer_id=new.id order by id loop
      update public.products set updated_at=updated_at where id=target;
    end loop;
  end if;
  return null;
end $$;
revoke all on function private.touch_company_publications() from public,anon,authenticated;
create trigger manufacturers_publication_clock after update on public.manufacturers
  for each row execute function private.touch_company_publications();
commit;
