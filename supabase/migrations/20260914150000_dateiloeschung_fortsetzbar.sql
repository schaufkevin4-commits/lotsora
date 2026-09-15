-- B3/F05: dauerhafter Dateibezug vor Upload und über die Produktlöschung hinaus.
-- Storage-Daten werden ausschließlich über die Storage-API verändert.
lock table public.products, public.documents in share row exclusive mode;

create table public.file_operations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  owner_id uuid not null,
  document_id uuid,
  file_path text not null unique,
  file_name text not null,
  state text not null check (state in ('uploading', 'attached', 'cleanup', 'deleted')),
  reason text not null check (reason in ('upload', 'document_delete', 'product_delete')),
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text,
  constraint file_operations_product_path check (file_path ~ ('^' || product_id::text || '/[A-Za-z0-9._-]+$'))
);
-- Absichtlich keine kaskadierenden FKs: Produkt-/Kontolöschung darf den
-- noch benötigten Dateibezug nicht entfernen. Erledigte Pfade bleiben reserviert.
create index file_operations_owner_state_idx on public.file_operations(owner_id, state);
create index file_operations_product_idx on public.file_operations(product_id);
alter table public.file_operations enable row level security;
revoke all on public.file_operations from public, anon, authenticated;
grant select on public.file_operations to authenticated;
grant all on public.file_operations to service_role;
create policy "Dateivorgaenge: eigene lesen" on public.file_operations
  for select to authenticated using (owner_id = (select auth.uid()));

-- Unzuordenbare Altdateien verlangen eine Bestandsprüfung statt Besitzer-Raten.
do $$
begin
  if exists (
    select 1 from storage.objects o where o.bucket_id = 'produkt-dokumente'
    and not exists (select 1 from public.products p where o.name ~ ('^' || p.id::text || '/[A-Za-z0-9._-]+$'))
  ) then
    raise exception 'Unzuordenbare Dokumentdateien: Bestand vor B3-Migration prüfen.' using errcode = '23514';
  end if;
end;
$$;

insert into public.file_operations(product_id, owner_id, document_id, file_path, file_name, state, reason)
select p.id, m.user_id,
  (select d.id from public.documents d where d.file_path = o.name order by d.id limit 1),
  o.name, split_part(o.name, '/', 2),
  case when exists(select 1 from public.documents d where d.file_path = o.name) then 'attached' else 'uploading' end,
  'upload'
from storage.objects o join public.products p on o.name ~ ('^' || p.id::text || '/[A-Za-z0-9._-]+$')
join public.manufacturers m on m.id = p.manufacturer_id
where o.bucket_id = 'produkt-dokumente';

-- Auch fehlende Altdateien behalten ihren Dokumentbezug und bleiben löschbar.
insert into public.file_operations(product_id, owner_id, document_id, file_path, file_name, state, reason)
select distinct on (d.file_path) p.id, m.user_id, d.id, d.file_path,
  coalesce(d.file_name, split_part(d.file_path, '/', 2)), 'attached', 'upload'
from public.documents d join public.products p on p.id = d.product_id
join public.manufacturers m on m.id = p.manufacturer_id where d.file_path is not null
order by d.file_path, d.id
on conflict (file_path) do nothing;

create function public.reserve_document_upload(p_product_id uuid, p_file_name text)
returns public.file_operations
language plpgsql security definer set search_path = ''
as $$
declare owner_uuid uuid; result public.file_operations;
begin
  select m.user_id into owner_uuid from public.products p join public.manufacturers m on m.id = p.manufacturer_id
    where p.id = p_product_id for update of p;
  if not found or owner_uuid is distinct from auth.uid() then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  if p_file_name is null or p_file_name !~ '^[A-Za-z0-9._-]{1,180}$' then
    raise exception 'Ungültiger Dateiname.' using errcode = '22023';
  end if;
  insert into public.file_operations(product_id, owner_id, file_path, file_name, state, reason)
  values(p_product_id, owner_uuid, p_product_id::text || '/' || gen_random_uuid()::text || '-' || p_file_name, p_file_name, 'uploading', 'upload')
  returning * into result;
  return result;
end;
$$;
revoke all on function public.reserve_document_upload(uuid, text) from public, anon;
grant execute on function public.reserve_document_upload(uuid, text) to authenticated;

-- RLS hält dieselbe Produktsperre wie DELETE bis zum Ende der Storage-Transaktion.
-- Ein verspäteter Upload kann nach Produktlöschung/Uploadabbruch nicht entstehen.
create function public.can_write_product_file(p_path text)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare operation public.file_operations; owner_uuid uuid;
begin
  select * into operation from public.file_operations where file_path = p_path;
  if not found or operation.owner_id is distinct from auth.uid() then return false; end if;
  select m.user_id into owner_uuid from public.products p join public.manufacturers m on m.id = p.manufacturer_id
    where p.id = operation.product_id for update of p;
  if not found or owner_uuid is distinct from auth.uid() then return false; end if;
  select * into operation from public.file_operations where file_path = p_path for update;
  return operation.state in ('uploading', 'attached');
end;
$$;
revoke all on function public.can_write_product_file(text) from public, anon;
grant execute on function public.can_write_product_file(text) to authenticated;

alter policy "Dok-Datei: eigene anlegen" on storage.objects
  with check (bucket_id = 'produkt-dokumente' and public.can_write_product_file(name));
alter policy "Dok-Datei: eigene aendern" on storage.objects
  using (bucket_id = 'produkt-dokumente' and public.can_write_product_file(name))
  with check (bucket_id = 'produkt-dokumente' and public.can_write_product_file(name));
create policy "Dok-Datei: eigener offener Loeschvorgang lesen" on storage.objects for select to authenticated
  using (bucket_id = 'produkt-dokumente' and exists (
    select 1 from public.file_operations f where f.file_path = name and f.owner_id = (select auth.uid()) and f.state = 'cleanup'
  ));
create policy "Dok-Datei: eigenen Loeschvorgang ausfuehren" on storage.objects for delete to authenticated
  using (bucket_id = 'produkt-dokumente' and exists (
    select 1 from public.file_operations f where f.file_path = name and f.owner_id = (select auth.uid()) and f.state = 'cleanup'
  ));

-- Dokumentbindung und Datei-Aufräumen dürfen sich nicht überholen.
create function private.lock_document_file_operation()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare previous_id uuid; next_id uuid; locked_id uuid; operation public.file_operations;
begin
  if tg_op <> 'INSERT' then previous_id := old.product_id; end if;
  if tg_op <> 'DELETE' then next_id := new.product_id; end if;
  for locked_id in select distinct id from unnest(array[previous_id, next_id]) ids(id) where id is not null order by id loop
    perform 1 from public.products where id = locked_id for update;
  end loop;
  if tg_op <> 'DELETE' and new.file_path is not null then
    select * into operation from public.file_operations where file_path = new.file_path for update;
    if not found or operation.state not in ('uploading', 'attached') or operation.product_id <> new.product_id then
      raise exception 'Datei ist nicht verfügbar oder ihre Löschung wurde bereits begonnen.' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.lock_document_file_operation() from public, anon, authenticated;
create trigger documents_lock_file_operation before insert or update or delete on public.documents
  for each row execute function private.lock_document_file_operation();

create function private.track_document_file_operation()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op <> 'DELETE' and new.file_path is not null then
    update public.file_operations set state = 'attached', document_id = new.id, last_error = null where file_path = new.file_path;
  end if;
  if tg_op <> 'INSERT' and old.file_path is not null and not exists(select 1 from public.documents where file_path = old.file_path) then
    update public.file_operations set state = 'cleanup', document_id = old.id,
      reason = case when reason = 'product_delete' then reason else 'document_delete' end
      where file_path = old.file_path and state <> 'deleted';
  end if;
  return null;
end;
$$;
revoke all on function private.track_document_file_operation() from public, anon, authenticated;
create trigger documents_track_file_operation after insert or update or delete on public.documents
  for each row execute function private.track_document_file_operation();

create function private.track_product_file_deletion()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.file_operations set state = 'cleanup', reason = 'product_delete'
    where product_id = old.id and state <> 'deleted';
  return old;
end;
$$;
revoke all on function private.track_product_file_deletion() from public, anon, authenticated;
create trigger products_track_file_deletion before delete on public.products
  for each row execute function private.track_product_file_deletion();

create function public.begin_file_cleanup(p_operation_id uuid)
returns public.file_operations
language plpgsql security definer set search_path = ''
as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id;
  if not found or operation.owner_id is distinct from auth.uid() then
    raise exception 'Dateivorgang nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  perform 1 from public.products where id = operation.product_id for update;
  select * into operation from public.file_operations where id = p_operation_id for update;
  if operation.state = 'attached' or exists(select 1 from public.documents where file_path = operation.file_path) then
    raise exception 'Datei gehört zu einem vorhandenen Dokument.' using errcode = '23514';
  end if;
  if operation.state <> 'deleted' then
    update public.file_operations set state = 'cleanup', attempts = attempts + 1, last_error = null
      where id = p_operation_id returning * into operation;
  end if;
  return operation;
end;
$$;
revoke all on function public.begin_file_cleanup(uuid) from public, anon;
grant execute on function public.begin_file_cleanup(uuid) to authenticated;

create function public.finish_file_cleanup(p_operation_id uuid, p_error_code text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id for update;
  if not found or operation.owner_id is distinct from auth.uid() then
    raise exception 'Dateivorgang nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  if operation.state = 'deleted' then return true; end if;
  if operation.state <> 'cleanup' then
    raise exception 'Dateilöschung wurde nicht begonnen.' using errcode = '23514';
  end if;
  if p_error_code is not null then
    update public.file_operations set last_error = left(regexp_replace(p_error_code, '[^A-Za-z0-9_-]', '', 'g'), 80) where id = p_operation_id;
    return false;
  end if;
  if exists(select 1 from storage.objects where bucket_id = 'produkt-dokumente' and name = operation.file_path)
    or exists(select 1 from public.documents where file_path = operation.file_path) then
    update public.file_operations set last_error = 'file_still_present' where id = p_operation_id;
    return false;
  end if;
  update public.file_operations set state = 'deleted', last_error = null where id = p_operation_id;
  return true;
end;
$$;
revoke all on function public.finish_file_cleanup(uuid, text) from public, anon;
grant execute on function public.finish_file_cleanup(uuid, text) to authenticated;
