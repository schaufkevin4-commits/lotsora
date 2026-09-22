-- P2-2: bewusste Neuanlage für bestätigte Konten ohne Firmenzugehörigkeit.
-- Request-Belege verhindern doppelte Firmen bei Antwortverlust/Wiederholung.
-- Nach Firmenlöschung bleibt nur ein Hash des Namens, keine alten Firmendaten.
create table private.company_creation_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  company_id uuid references public.manufacturers(id) on delete set null,
  name_hash bytea not null,
  primary key(user_id, request_id)
);
revoke all on private.company_creation_requests from public, anon, authenticated;

create function public.get_company_entry_state() returns text
language plpgsql stable security definer set search_path='' as $$
declare actor auth.users;
begin
  select * into actor from auth.users where id=auth.uid();
  if not found then raise exception 'Bitte anmelden.' using errcode='42501'; end if;
  if actor.email_confirmed_at is null then return 'unconfirmed'; end if;
  if exists(select 1 from private.deletion_accounts where user_id=actor.id)
    or exists(select 1 from public.deletion_jobs where actor_id=actor.id and state='pending') then
    return 'deleting';
  end if;
  if exists(select 1 from public.manufacturer_memberships where user_id=actor.id) then return 'member'; end if;
  return 'ready';
end $$;

create function public.create_own_company(p_name text, p_request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor auth.users; receipt private.company_creation_requests; company_uuid uuid; clean_name text;
begin
  -- Beitritt und Kontolöschung serialisieren ebenfalls an diesem Konto.
  -- Keine bereits bestehende Firmenzeile nach dieser Kontosperre sperren:
  -- Die anderen Abläufe nehmen Firmen- vor Kontosperren.
  select * into actor from auth.users where id=auth.uid() for update;
  if not found or actor.email_confirmed_at is null then
    raise exception 'Bitte mit bestätigtem Konto anmelden.' using errcode='42501';
  end if;
  clean_name := btrim(p_name);
  if p_request_id is null or clean_name is null or length(clean_name) not between 1 and 200
    or clean_name ~ '[[:cntrl:]]' or clean_name ~ '^[[:space:]]*$' then
    raise exception 'Bitte einen gültigen Firmennamen angeben.' using errcode='22023';
  end if;
  if exists(select 1 from private.deletion_accounts where user_id=actor.id)
    or exists(select 1 from public.deletion_jobs where actor_id=actor.id and state='pending') then
    raise exception 'Bitte zuerst den Löschvorgang abschließen.' using errcode='P2202';
  end if;

  select * into receipt from private.company_creation_requests
    where user_id=actor.id and request_id=p_request_id;
  if found then
    if receipt.company_id is null then
      raise exception 'Dieser Vorgang ist beendet. Bitte neu beginnen.' using errcode='P2203';
    end if;
    if receipt.name_hash is distinct from sha256(convert_to(clean_name,'UTF8')) then
      raise exception 'Dieser Vorgang gehört zu anderen Eingaben.' using errcode='P2203';
    end if;
    if exists(select 1 from public.manufacturers m join public.manufacturer_memberships s
      on s.manufacturer_id=m.id and s.user_id=actor.id
      where m.id=receipt.company_id and m.user_id=actor.id) then
      return receipt.company_id;
    end if;
    raise exception 'Die Firmenzugehörigkeit wurde geändert.' using errcode='P2201';
  end if;

  if exists(select 1 from public.manufacturer_memberships where user_id=actor.id) then
    raise exception 'Dieses Konto gehört bereits zu einer Firma.' using errcode='P2201';
  end if;
  insert into public.manufacturers(user_id,company_name) values(actor.id,clean_name)
    returning id into company_uuid;
  insert into public.manufacturer_memberships(manufacturer_id,user_id) values(company_uuid,actor.id);
  insert into private.company_creation_requests(user_id,request_id,company_id,name_hash)
    values(actor.id,p_request_id,company_uuid,sha256(convert_to(clean_name,'UTF8')));
  return company_uuid;
end $$;
revoke all on function public.get_company_entry_state(), public.create_own_company(text,uuid) from public,anon;
grant execute on function public.get_company_entry_state(), public.create_own_company(text,uuid) to authenticated;
