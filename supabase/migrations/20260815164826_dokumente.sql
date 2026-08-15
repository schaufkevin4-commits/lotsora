create type public.document_visibility as enum ('intern', 'oeffentlich');

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null,                       -- Dokumentname
  doc_type    text,                                -- Zertifikat, Prüfbericht, ...
  file_name   text,                                -- Original-Dateiname
  file_path   text,                                -- Pfad im Supabase Storage (später)
  description text,
  visibility  public.document_visibility not null default 'intern',  -- A-020
  uploaded_at timestamptz not null default now()
);
create index documents_product_id_idx on public.documents (product_id);

alter table public.documents enable row level security;

create policy "Dokument: eigene lesen"    on public.documents for select to authenticated using (owns_product(product_id));
create policy "Dokument: eigene anlegen"  on public.documents for insert to authenticated with check (owns_product(product_id));
create policy "Dokument: eigene aendern"  on public.documents for update to authenticated using (owns_product(product_id)) with check (owns_product(product_id));
create policy "Dokument: eigene loeschen" on public.documents for delete to authenticated using (owns_product(product_id));