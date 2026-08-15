create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.manufacturers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  company_name   text not null,
  contact_person text,
  email          text,
  phone          text,
  website        text,
  street         text,
  postal_code    text,
  city           text,
  country        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger manufacturers_set_updated_at
  before update on public.manufacturers
  for each row execute function public.set_updated_at();

alter table public.manufacturers enable row level security;

create policy "Hersteller sieht eigene Firma"
  on public.manufacturers for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Hersteller legt eigene Firma an"
  on public.manufacturers for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Hersteller aendert eigene Firma"
  on public.manufacturers for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Hersteller loescht eigene Firma"
  on public.manufacturers for delete to authenticated
  using ((select auth.uid()) = user_id);