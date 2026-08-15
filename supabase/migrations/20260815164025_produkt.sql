create type public.product_status as enum ('entwurf', 'unvollstaendig', 'veroeffentlicht');

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  name            text not null,          -- Pflicht
  description     text not null,          -- Pflicht
  category        text not null,          -- Pflicht
  status          public.product_status not null default 'entwurf',  -- Pflicht
  article_number  text,                   -- optional
  sku             text,                   -- optional
  gtin_ean        text,                   -- optional
  brand           text,                   -- optional
  image_url       text,                   -- optional
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_manufacturer_id_idx on public.products (manufacturer_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Hilfsfunktion: gehört das Produkt dem eingeloggten Nutzer? (für spätere Detailtabellen)
create or replace function public.owns_product(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    join public.manufacturers m on m.id = p.manufacturer_id
    where p.id = p_product
      and m.user_id = (select auth.uid())
  );
$$;

alter table public.products enable row level security;

create policy "Produkte: eigene lesen"
  on public.products for select to authenticated
  using (manufacturer_id in (
    select id from public.manufacturers where user_id = (select auth.uid())
  ));

create policy "Produkte: eigene anlegen"
  on public.products for insert to authenticated
  with check (manufacturer_id in (
    select id from public.manufacturers where user_id = (select auth.uid())
  ));

create policy "Produkte: eigene aendern"
  on public.products for update to authenticated
  using (manufacturer_id in (
    select id from public.manufacturers where user_id = (select auth.uid())
  ))
  with check (manufacturer_id in (
    select id from public.manufacturers where user_id = (select auth.uid())
  ));

create policy "Produkte: eigene loeschen"
  on public.products for delete to authenticated
  using (manufacturer_id in (
    select id from public.manufacturers where user_id = (select auth.uid())
  ));