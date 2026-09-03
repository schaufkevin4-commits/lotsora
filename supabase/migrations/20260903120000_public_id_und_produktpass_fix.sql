-- Dauerhafte, nicht erratbare Produktpass-IDs und Korrektur des anonymen
-- Produktpass-Lesepfads (N1). Die interne UUID bleibt Primärschlüssel für alle
-- Relationen; public_id ist ausschließlich der stabile Schlüssel in /p/<id>.

create schema if not exists private;
revoke all on schema private from public;
create extension if not exists pgcrypto with schema extensions;

-- Reservierte IDs bleiben auch nach dem Löschen eines Produkts bestehen. So kann
-- ein bereits gedruckter QR-Code niemals einem späteren Produkt zugeordnet werden.
create table private.product_public_ids (
  public_id text primary key,
  reserved_at timestamptz not null default now(),
  constraint product_public_ids_format
    check (public_id ~ '^[1-9A-HJ-NP-Za-km-z]{12}$')
);

alter table private.product_public_ids enable row level security;
revoke all on private.product_public_ids from public, anon, authenticated;

alter table public.products add column public_id text;

-- 12 Zeichen aus dem Base58-Alphabet ohne 0, O, I und l. Rejection Sampling
-- vermeidet die kleine Verzerrung, die ein einfaches Byte-modulo-58 erzeugt.
create or replace function public.generate_product_public_id()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  result text := '';
  random_byte integer;
begin
  while length(result) < 12 loop
    random_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if random_byte < 232 then
      result := result || substr(alphabet, (random_byte % 58) + 1, 1);
    end if;
  end loop;

  return result;
end;
$$;

revoke all on function public.generate_product_public_id() from public, anon;
grant execute on function public.generate_product_public_id() to authenticated, service_role;

-- Bestehende Produkte werden vor dem ersten realen QR-Code vollständig
-- nachgezogen. Die Reservierung und Zuweisung geschehen in derselben Transaktion.
do $$
declare
  product_row record;
  candidate text;
begin
  for product_row in select id from public.products where public_id is null loop
    loop
      candidate := public.generate_product_public_id();
      insert into private.product_public_ids (public_id)
      values (candidate)
      on conflict do nothing;

      if found then
        update public.products
        set public_id = candidate
        where id = product_row.id;
        exit;
      end if;
    end loop;
  end loop;
end;
$$;

alter table public.products
  alter column public_id set default public.generate_product_public_id(),
  alter column public_id set not null,
  add constraint products_public_id_format
    check (public_id ~ '^[1-9A-HJ-NP-Za-km-z]{12}$'),
  add constraint products_public_id_key unique (public_id),
  add constraint products_public_id_reserved_fkey
    foreign key (public_id) references private.product_public_ids (public_id);

-- Neue IDs werden unabhängig von einem eventuell mitgesendeten Wert immer in
-- der Datenbank erzeugt und dauerhaft reserviert.
create or replace function private.assign_product_public_id()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  candidate text;
begin
  loop
    candidate := public.generate_product_public_id();
    insert into private.product_public_ids (public_id)
    values (candidate)
    on conflict do nothing;

    if found then
      new.public_id := candidate;
      return new;
    end if;
  end loop;
end;
$$;

revoke all on function private.assign_product_public_id() from public, anon, authenticated;

create trigger products_assign_public_id
before insert on public.products
for each row execute function private.assign_product_public_id();

-- Nach der Zuweisung ist die öffentliche ID unveränderlich.
create or replace function private.prevent_product_public_id_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.public_id is distinct from old.public_id then
    raise exception 'products.public_id ist unveränderlich'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_product_public_id_change()
  from public, anon, authenticated;

create trigger products_prevent_public_id_change
before update of public_id on public.products
for each row execute function private.prevent_product_public_id_change();

-- Der anonyme Leser braucht die öffentliche ID für die Suche und die interne
-- Hersteller-Zuordnung ausschließlich zum Nachladen der freigegebenen Firmendaten.
-- RLS lässt weiterhin nur veröffentlichte Produkte durch.
grant select (public_id, manufacturer_id) on public.products to anon;
