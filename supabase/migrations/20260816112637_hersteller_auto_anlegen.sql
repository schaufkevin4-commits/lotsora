-- Migration: Hersteller-Zeile automatisch bei Registrierung anlegen
-- Quelle: PP-017 (ein Login = ein Hersteller). Standard-Supabase-Muster (Trigger auf auth.users).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.manufacturers (user_id, company_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), 'Mein Unternehmen')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();