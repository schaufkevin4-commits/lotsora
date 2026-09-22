-- P2-4: genau ein bewusst freigegebener, vollständiger öffentlicher Stand.
begin;
lock table public.manufacturers, public.products, public.documents, public.file_operations
  in share row exclusive mode;

create table private.product_publications (
  product_id uuid primary key references public.products(id) on delete cascade,
  public_id text not null unique,
  payload jsonb not null,
  files jsonb not null,
  source_token text not null,
  published_at timestamptz not null
);
alter table private.product_publications enable row level security;
revoke all on private.product_publications from public,anon,authenticated;

-- Explizite Positivliste: keine internen Notizen, Kontaktdaten oder Artikelnummern.
-- files bleibt ausschließlich intern. Ein SQL-Snapshot liest alle Teilbereiche.
create function private.publication_candidate(p_product_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'editor_version',p.editor_version,
    'pass',jsonb_build_object(
      'produkt',jsonb_build_object('public_id',p.public_id,'name',p.name,'description',p.description,
        'category',p.category,'brand',p.brand,
        'image_url',case when p.image_url is not null then '/p/'||p.public_id||'/bild?stand='||md5(p.image_url) end),
      'hersteller',jsonb_build_object('company_name',m.company_name,'country',m.country,'website',m.website),
      'materialien',coalesce((select jsonb_agg(jsonb_build_object('id',id,'material_name',material_name,'percentage',percentage) order by created_at,id)
        from public.product_materials where product_id=p.id),'[]'::jsonb),
      'textildaten',(select jsonb_build_object('origin_country',origin_country,'color',color,'size',size,'care_instructions',care_instructions,'wash_instructions',wash_instructions)
        from public.product_textile_data where product_id=p.id),
      'nachhaltigkeit',(select jsonb_build_object('recycling_notes',recycling_notes,'repair_notes',repair_notes,'disposal_notes',disposal_notes,'reusable_materials',reusable_materials)
        from public.product_sustainability where product_id=p.id),
      'dokumente',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'doc_type',doc_type,
        'url','/p/'||p.public_id||'/dokumente/'||id::text) order by uploaded_at,id)
        from public.documents where product_id=p.id and visibility='oeffentlich'),'[]'::jsonb)
    ),
    'files',coalesce((select jsonb_agg(ref order by ref::text) from (
      select jsonb_build_object('document_id',null,'file_path',p.image_url) ref where p.image_url is not null
      union all
      select jsonb_build_object('document_id',d.id,'file_path',d.file_path)
        from public.documents d where d.product_id=p.id and d.visibility='oeffentlich' and d.file_path is not null
    ) refs),'[]'::jsonb)
  ) from public.products p join public.manufacturers m on m.id=p.manufacturer_id where p.id=p_product_id;
$$;
revoke all on function private.publication_candidate(uuid) from public,anon,authenticated;

create function public.get_product_publication_review(p_product_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare candidate jsonb; published private.product_publications;
begin
  if auth.uid() is null or not public.owns_product(p_product_id) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode='42501';
  end if;
  candidate:=private.publication_candidate(p_product_id);
  select * into published from private.product_publications where product_id=p_product_id;
  return jsonb_build_object('token',md5(candidate::text),
    'published_at',published.published_at,
    'has_changes',published.product_id is null or published.source_token is distinct from md5(candidate::text));
end $$;
revoke all on function public.get_product_publication_review(uuid) from public,anon;
grant execute on function public.get_product_publication_review(uuid) to authenticated;

-- Alle anonymen Entwurfs-Leserechte schließen, auch bisherige Spalten-Grants.
do $$
declare t text; col text;
begin
  foreach t in array array['products','manufacturers','documents','product_materials','product_textile_data','product_sustainability'] loop
    execute format('revoke select on public.%I from public,anon',t);
    for col in select attname from pg_attribute where attrelid=('public.'||t)::regclass and attnum>0 and not attisdropped loop
      execute format('revoke select (%I) on public.%I from public,anon',col,t);
    end loop;
  end loop;
end $$;
drop policy "Produkte: veroeffentlichte oeffentlich lesen" on public.products;
drop policy "Dokument: freigegebene oeffentlich lesen" on public.documents;
drop policy "Hersteller: oeffentlich bei veroeffentlichtem Produkt" on public.manufacturers;
drop policy "Material: oeffentlich bei veroeffentlichtem Produkt" on public.product_materials;
drop policy "Textil: oeffentlich bei veroeffentlichtem Produkt" on public.product_textile_data;
drop policy "Nachhaltigkeit: oeffentlich bei veroeffentlichtem Produkt" on public.product_sustainability;

create function public.get_published_product_pass(p_public_id text) returns jsonb
language sql stable security definer set search_path='' as $$
  select payload from private.product_publications where public_id=p_public_id;
$$;
create function public.get_published_file_path(p_public_id text,p_document_id uuid default null) returns text
language sql stable security definer set search_path='' as $$
  select f->>'file_path' from private.product_publications s cross join lateral jsonb_array_elements(s.files) f
    where s.public_id=p_public_id and (f->>'document_id')::uuid is not distinct from p_document_id;
$$;
create function public.is_published_product_file(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.product_publications s cross join lateral jsonb_array_elements(s.files) f
    where f->>'file_path'=p_path);
$$;
revoke all on function public.get_published_product_pass(text),public.get_published_file_path(text,uuid),
  public.is_published_product_file(text) from public;
grant execute on function public.get_published_product_pass(text),public.get_published_file_path(text,uuid),
  public.is_published_product_file(text) to anon,authenticated;
-- Alte Bildabfrage darf keinen privaten Arbeitsstand verraten/freigeben.
create or replace function public.is_public_product_image(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.product_publications s cross join lateral jsonb_array_elements(s.files) f
    where f->>'file_path'=p_path and f->>'document_id' is null);
$$;
drop policy "Produktbild: veroeffentlicht lesen" on storage.objects;
alter policy "Dok-Datei: freigegebene oeffentlich lesen" on storage.objects to anon,authenticated
  using (bucket_id='produkt-dokumente' and public.is_published_product_file(name));

-- Referenzierte Dateien bleiben attached, auch wenn der Arbeitsstand sie entfernt.
create function private.keep_published_file() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.state='cleanup' and new.reason<>'product_delete' and public.is_published_product_file(new.file_path) then
    new.state:='attached';
  end if;
  return new;
end $$;
revoke all on function private.keep_published_file() from public,anon,authenticated;
create trigger file_operations_keep_publication before update on public.file_operations
  for each row execute function private.keep_published_file();

create function private.release_publication_files() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.file_operations f set state='cleanup',reason='document_delete'
    where f.product_id=old.product_id and f.state='attached'
    and not public.is_published_product_file(f.file_path)
    and not exists(select 1 from public.documents d where d.file_path=f.file_path)
    and not exists(select 1 from public.products p where p.image_url=f.file_path);
  return null;
end $$;
revoke all on function private.release_publication_files() from public,anon,authenticated;
create trigger publications_release_files after update or delete on private.product_publications
  for each row execute function private.release_publication_files();

-- Anforderungen gelten dem freigegebenen Stand, unvollständige Arbeitsstände bleiben speicherbar.
alter table public.products drop constraint products_published_required_fields;
create function private.store_product_publication(p_product_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare candidate jsonb; stamp timestamptz:=clock_timestamp(); ref jsonb;
begin
  candidate:=private.publication_candidate(p_product_id);
  if candidate is null or not (
    candidate#>>'{pass,produkt,name}' ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    and candidate#>>'{pass,produkt,description}' ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    and candidate#>>'{pass,produkt,category}' ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
  ) then raise exception 'Pflichtangaben fehlen.' using errcode='23514'; end if;
  if (select coalesce(sum((x->>'percentage')::numeric),0) from jsonb_array_elements(candidate#>'{pass,materialien}') x)>100 then
    raise exception 'Materialsumme überschritten.' using errcode='23514';
  end if;
  for ref in select value from jsonb_array_elements(candidate->'files') loop
    if not exists(select 1 from public.file_operations f join storage.objects o
      on o.bucket_id='produkt-dokumente' and o.name=f.file_path
      where f.file_path=ref->>'file_path' and f.product_id=p_product_id and f.validated and f.state='attached') then
      raise exception 'Veröffentlichte Datei fehlt oder wurde nicht geprüft.' using errcode='23514';
    end if;
  end loop;
  insert into private.product_publications(product_id,public_id,payload,files,source_token,published_at)
    values(p_product_id,candidate#>>'{pass,produkt,public_id}',
      jsonb_set(candidate->'pass','{produkt,updated_at}',to_jsonb(stamp)),candidate->'files',md5(candidate::text),stamp)
    on conflict(product_id) do update set payload=excluded.payload,files=excluded.files,
      source_token=excluded.source_token,published_at=excluded.published_at;
end $$;
revoke all on function private.store_product_publication(uuid) from public,anon,authenticated;

-- Bewusst neuer Vertrag: alter Drei-Argumente-RPC darf die Gesamtprüfung nicht umgehen.
revoke execute on function public.set_product_publication_checked(uuid,bigint,boolean) from authenticated;
create function public.publish_product_revision(p_product_id uuid,p_expected_version bigint,p_expected_token text,p_publish boolean)
returns bigint language plpgsql security definer set search_path='' as $$
declare current_version bigint; candidate jsonb;
begin
  current_version:=private.lock_product_editor(p_product_id);
  if current_version is distinct from p_expected_version then
    raise exception 'Produkt wurde inzwischen geändert.' using errcode='40001'; end if;
  if p_publish is null then raise exception 'Veröffentlichungsauswahl fehlt.' using errcode='22023'; end if;
  candidate:=private.publication_candidate(p_product_id);
  if md5(candidate::text) is distinct from p_expected_token then
    raise exception 'Produkt, Dateien oder Firmenangaben wurden inzwischen geändert.' using errcode='40001'; end if;
  if p_publish then
    -- Auch Aktualisieren eines bereits veröffentlichten Passes verändert das Token.
    update public.products set status='veroeffentlicht',editor_version=editor_version+1 where id=p_product_id;
    perform private.store_product_publication(p_product_id);
  else
    delete from private.product_publications where product_id=p_product_id;
    perform public.withdraw_product(p_product_id);
  end if;
  select editor_version into current_version from public.products where id=p_product_id;
  return current_version;
end $$;
-- Interne RLS-Schreibrolle mit ausschließlich den zusätzlich benötigten Helfern.
grant execute on function private.publication_candidate(uuid),private.store_product_publication(uuid) to lotsora_product_writer;
grant select,delete on private.product_publications to lotsora_product_writer;
create policy "Interne Veröffentlichungsrolle" on private.product_publications for all to lotsora_product_writer
  using(public.owns_product(product_id)) with check(public.owns_product(product_id));
grant create on schema public to lotsora_product_writer;
alter function public.publish_product_revision(uuid,bigint,text,boolean) owner to lotsora_product_writer;
revoke create on schema public from lotsora_product_writer;
revoke all on function public.publish_product_revision(uuid,bigint,text,boolean) from public,anon;
grant execute on function public.publish_product_revision(uuid,bigint,text,boolean) to authenticated;


-- Alte interne Helfer bleiben konsistent; normale API-Nutzer haben kein EXECUTE.
create or replace function public.publish_product(p_product_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.products where id=p_product_id for update;
  if not found then raise exception 'Zugriff verweigert.' using errcode='42501'; end if;
  update public.products set status='veroeffentlicht' where id=p_product_id;
  perform private.store_product_publication(p_product_id);
end $$;
create or replace function public.withdraw_product(p_product_id uuid)
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
  delete from private.product_publications where product_id=p_product_id;
  update public.products set status = case
    when name ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
      and description ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
      and category ~ U&'[^[:space:]\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    then 'entwurf'::public.product_status
    else 'unvollstaendig'::public.product_status end
  where id = p_product_id;
end;
$$;

-- Bestand atomar übernehmen; ungültige/fehlende veröffentlichte Dateien brechen ab.
do $$ declare product_uuid uuid; begin
  for product_uuid in select id from public.products where status='veroeffentlicht' order by id loop
    perform private.store_product_publication(product_uuid);
  end loop;
end $$;

-- Neue Produkte beginnen privat; "published" per INSERT ist kein Freigabeweg.
create function private.require_private_product_insert() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.status='veroeffentlicht' then
    raise exception 'Produkt zuerst anlegen, dann bewusst veröffentlichen.' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function private.require_private_product_insert() from public,anon,authenticated;
create trigger products_require_private_insert before insert on public.products
  for each row execute function private.require_private_product_insert();
commit;
