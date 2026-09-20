-- V1: eine Firma je Benutzer, ein Verantwortlicher, gemeinsame Produktarbeit.
lock table public.manufacturers, public.products, public.file_operations in share row exclusive mode;

create table public.manufacturer_memberships (
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (manufacturer_id, user_id)
);
insert into public.manufacturer_memberships(manufacturer_id,user_id)
  select id,user_id from public.manufacturers;
-- Verantwortliche Konten dürfen nicht die komplette Firma mitlöschen.
alter table public.manufacturers drop constraint manufacturers_user_id_fkey;
alter table public.manufacturers add constraint manufacturers_user_id_fkey
  foreign key(user_id) references auth.users(id) on delete restrict;
alter table public.manufacturers add constraint manufacturers_owner_membership_fkey
  foreign key(id,user_id) references public.manufacturer_memberships(manufacturer_id,user_id)
  deferrable initially deferred;
alter table public.manufacturer_memberships enable row level security;
revoke all on public.manufacturer_memberships from public,anon,authenticated;
grant select on public.manufacturer_memberships to authenticated;
grant all on public.manufacturer_memberships to service_role;

create function public.is_company_member(p_company_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.manufacturer_memberships
    where manufacturer_id = p_company_id and user_id = (select auth.uid()));
$$;
create function public.is_company_owner(p_company_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.manufacturers
    where id = p_company_id and user_id = (select auth.uid()));
$$;
revoke all on function public.is_company_member(uuid), public.is_company_owner(uuid) from public,anon;
grant execute on function public.is_company_member(uuid), public.is_company_owner(uuid) to authenticated;
create policy "Team: eigene Firma lesen" on public.manufacturer_memberships
  for select to authenticated using (public.is_company_member(manufacturer_id));

alter policy "Hersteller sieht eigene Firma" on public.manufacturers using (public.is_company_member(id));
-- Firma wird ausschließlich bei Registrierung angelegt; Besitzerwechsel per RPC.
revoke insert,delete,update on public.manufacturers from authenticated;
grant update(company_name,contact_person,email,phone,website,street,postal_code,city,country)
  on public.manufacturers to authenticated;
create or replace function public.owns_product(p_product uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.products p
    where p.id = p_product and public.is_company_member(p.manufacturer_id));
$$;
alter policy "Produkte: eigene lesen" on public.products using (public.is_company_member(manufacturer_id));
alter policy "Produkte: eigene anlegen" on public.products with check (public.is_company_member(manufacturer_id));
alter policy "Produkte: eigene aendern" on public.products using (public.is_company_member(manufacturer_id)) with check (public.is_company_member(manufacturer_id));
alter policy "Produkte: eigene loeschen" on public.products using (public.is_company_member(manufacturer_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare company_uuid uuid;
begin
  -- Unvertrauenswürdige Metadaten unterdrücken nur eine Firmenneuanlage.
  -- Sie vergeben weder Firma noch Rechte; Beitritt verlangt eine geprüfte Einladung.
  if new.raw_user_meta_data->>'join_team' = 'true' then return new; end if;
  insert into public.manufacturers(user_id,company_name)
    values(new.id,coalesce(nullif(btrim(new.raw_user_meta_data->>'company_name'),''),'Mein Unternehmen'))
    returning id into company_uuid;
  insert into public.manufacturer_memberships(manufacturer_id,user_id) values(company_uuid,new.id);
  return new;
end $$;

create table public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid
);
create index company_invitations_company_idx on public.company_invitations(manufacturer_id);
alter table public.company_invitations enable row level security;
revoke all on public.company_invitations from public,anon,authenticated;
grant select(id,manufacturer_id,email,created_by,created_at,expires_at,revoked_at,accepted_at,accepted_by)
  on public.company_invitations to authenticated;
grant all on public.company_invitations to service_role;
create policy "Einladungen: Verantwortlicher liest" on public.company_invitations
  for select to authenticated using (public.is_company_owner(manufacturer_id));

create function public.list_company_members()
returns table(user_id uuid,email text,role text,joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select u.id,u.email::text,case when m.user_id = u.id then 'owner' else 'member' end,s.created_at
  from public.manufacturer_memberships s
  join public.manufacturers m on m.id = s.manufacturer_id
  join auth.users u on u.id = s.user_id
  where public.is_company_member(s.manufacturer_id)
  order by (m.user_id = u.id) desc,s.created_at;
$$;

create function public.create_company_invitation(p_email text)
returns table(invitation_id uuid,token text,expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare company_uuid uuid; invitation public.company_invitations; secret text; recipient text;
begin
  select id into company_uuid from public.manufacturers where user_id = auth.uid() for update;
  if not found then raise exception 'Nur Firmenverantwortliche dürfen einladen.' using errcode='42501'; end if;
  recipient := lower(btrim(p_email));
  if recipient is null or length(recipient) > 254 or recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Bitte eine gültige E-Mail-Adresse angeben.' using errcode='22023';
  end if;
  if exists(select 1 from public.manufacturer_memberships s join auth.users u on u.id=s.user_id
    where s.manufacturer_id=company_uuid and lower(u.email)=recipient) then
    raise exception 'Diese Person gehört bereits zur Firma.' using errcode='22023';
  end if;
  update public.company_invitations set revoked_at=now()
    where manufacturer_id=company_uuid and email=recipient and accepted_at is null and revoked_at is null;
  if (select count(*) from public.company_invitations i where i.manufacturer_id=company_uuid
    and i.accepted_at is null and i.revoked_at is null and i.expires_at>now()) >= 25 then
    raise exception 'Bitte zuerst offene Einladungen widerrufen.' using errcode='22023';
  end if;
  secret := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
  insert into public.company_invitations(manufacturer_id,email,token_hash,created_by)
    values(company_uuid,recipient,encode(sha256(convert_to(secret,'UTF8')),'hex'),auth.uid()) returning * into invitation;
  return query select invitation.id,secret,invitation.expires_at;
end $$;

create function public.accept_company_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.company_invitations; actor auth.users; company_owner uuid; existing_company uuid;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Einladung ungültig oder abgelaufen.' using errcode='22023';
  end if;
  select * into invitation from public.company_invitations
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  if not found then raise exception 'Einladung ungültig oder abgelaufen.' using errcode='22023'; end if;
  -- Gleiche Sperrreihenfolge für Einladen, Widerrufen, Beitritt und Rollenwechsel.
  select user_id into company_owner from public.manufacturers where id=invitation.manufacturer_id for update;
  select * into invitation from public.company_invitations where id=invitation.id for update;
  select * into actor from auth.users where id=auth.uid() for update;
  if not found or actor.email_confirmed_at is null or lower(actor.email) is distinct from invitation.email then
    raise exception 'Bitte mit der eingeladenen, bestätigten E-Mail-Adresse anmelden.' using errcode='42501';
  end if;
  select manufacturer_id into existing_company from public.manufacturer_memberships where user_id=actor.id;
  if invitation.accepted_by=actor.id and existing_company=invitation.manufacturer_id then return existing_company; end if;
  if invitation.revoked_at is not null or invitation.accepted_at is not null
    or invitation.expires_at<=now() or company_owner is distinct from invitation.created_by then
    raise exception 'Einladung ungültig oder abgelaufen.' using errcode='22023';
  end if;
  if existing_company is not null then
    raise exception 'Dieses Konto gehört bereits zu einer Firma. Ein Firmenwechsel ist hier nicht möglich.' using errcode='23514';
  end if;
  insert into public.manufacturer_memberships(manufacturer_id,user_id) values(invitation.manufacturer_id,actor.id);
  update public.company_invitations set accepted_at=now(),accepted_by=actor.id where id=invitation.id;
  return invitation.manufacturer_id;
end $$;

create function public.revoke_company_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare company_uuid uuid;
begin
  select id into company_uuid from public.manufacturers where user_id=auth.uid() for update;
  if not found then raise exception 'Zugriff verweigert.' using errcode='42501'; end if;
  update public.company_invitations set revoked_at=now()
    where id=p_invitation_id and manufacturer_id=company_uuid and accepted_at is null;
  if not found then raise exception 'Offene Einladung nicht gefunden.' using errcode='22023'; end if;
end $$;

create function public.remove_company_member(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare company_uuid uuid;
begin
  select id into company_uuid from public.manufacturers where user_id=auth.uid() for update;
  if not found or p_user_id=auth.uid() then
    raise exception 'Der Firmenverantwortliche kann nicht entfernt werden.' using errcode='42501';
  end if;
  delete from public.manufacturer_memberships where manufacturer_id=company_uuid and user_id=p_user_id;
  if not found then raise exception 'Teammitglied nicht gefunden.' using errcode='22023'; end if;
end $$;

create function public.transfer_company_ownership(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare company_uuid uuid;
begin
  select id into company_uuid from public.manufacturers where user_id=auth.uid() for update;
  if not found then raise exception 'Zugriff verweigert.' using errcode='42501'; end if;
  if p_user_id is null or not exists(select 1 from public.manufacturer_memberships
    where manufacturer_id=company_uuid and user_id=p_user_id) then
    raise exception 'Neuer Verantwortlicher muss zur Firma gehören.' using errcode='22023';
  end if;
  update public.manufacturers set user_id=p_user_id where id=company_uuid;
  update public.company_invitations set revoked_at=now()
    where manufacturer_id=company_uuid and accepted_at is null and revoked_at is null;
end $$;

revoke all on function public.list_company_members(),public.create_company_invitation(text),
  public.accept_company_invitation(text),public.revoke_company_invitation(uuid),
  public.remove_company_member(uuid),public.transfer_company_ownership(uuid) from public,anon;
grant execute on function public.list_company_members(),public.create_company_invitation(text),
  public.accept_company_invitation(text),public.revoke_company_invitation(uuid),
  public.remove_company_member(uuid),public.transfer_company_ownership(uuid) to authenticated;

-- Durable Firmenzuordnung: Aufräumen funktioniert auch nach Produktlöschung
-- oder Entfernung des ursprünglichen Uploaders. owner_id bleibt der Ersteller.
alter table public.file_operations add column manufacturer_id uuid;
update public.file_operations f set manufacturer_id=p.manufacturer_id from public.products p where p.id=f.product_id;
update public.file_operations f set manufacturer_id=m.id from public.manufacturers m
  where f.manufacturer_id is null and m.user_id=f.owner_id;
alter table public.file_operations add constraint file_operations_active_company
  check (manufacturer_id is not null or state='deleted');
create index file_operations_company_state_idx on public.file_operations(manufacturer_id,state);
alter policy "Dateivorgaenge: eigene lesen" on public.file_operations using (public.is_company_member(manufacturer_id));
alter policy "Dok-Datei: eigener offener Loeschvorgang lesen" on storage.objects
  using (bucket_id='produkt-dokumente' and exists(select 1 from public.file_operations f
    where f.file_path=name and public.is_company_member(f.manufacturer_id) and f.state='cleanup'));
alter policy "Dok-Datei: eigenen Loeschvorgang ausfuehren" on storage.objects
  using (bucket_id='produkt-dokumente' and exists(select 1 from public.file_operations f
    where f.file_path=name and public.is_company_member(f.manufacturer_id) and f.state='cleanup'));

-- Bestehende Dateiabläufe mit unveränderten Sperren/Inhaltsprüfungen.
create or replace function public.reserve_document_upload(p_product_id uuid, p_file_name text)
returns public.file_operations
language plpgsql security definer set search_path = ''
as $$
declare company_uuid uuid; result public.file_operations;
begin
  select p.manufacturer_id into company_uuid from public.products p
    where p.id = p_product_id for update of p;
  if not found or not public.is_company_member(company_uuid) then
    raise exception 'Produkt nicht gefunden oder Zugriff verweigert.' using errcode = '42501';
  end if;
  if p_file_name is null or p_file_name !~ '^[A-Za-z0-9._-]{1,180}$' then
    raise exception 'Ungültiger Dateiname.' using errcode = '22023';
  end if;
  insert into public.file_operations(product_id, owner_id, manufacturer_id, file_path, file_name, state, reason)
  values(p_product_id, auth.uid(), company_uuid, p_product_id::text || '/' || gen_random_uuid()::text || '-' || p_file_name, p_file_name, 'uploading', 'upload')
  returning * into result;
  return result;
end;
$$;

create or replace function public.can_write_product_file(p_path text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare operation public.file_operations; company_uuid uuid;
begin
  select * into operation from public.file_operations where file_path = p_path;
  if not found or not public.is_company_member(operation.manufacturer_id) then return false; end if;
  select p.manufacturer_id into company_uuid from public.products p
    where p.id = operation.product_id for update of p;
  if not found or not public.is_company_member(company_uuid) then return false; end if;
  select * into operation from public.file_operations where file_path = p_path for update;
  return operation.state = 'uploading' and operation.validation_started_at is null;
end $$;

create or replace function public.begin_file_cleanup(p_operation_id uuid)
returns public.file_operations
language plpgsql security definer set search_path = ''
as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id;
  if not found or not public.is_company_member(operation.manufacturer_id) then
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

create or replace function public.finish_file_cleanup(p_operation_id uuid, p_error_code text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id for update;
  if not found or not public.is_company_member(operation.manufacturer_id) then
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

create or replace function public.begin_file_validation(p_operation_id uuid)
returns public.file_operations language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id;
  if not found or not public.is_company_member(operation.manufacturer_id) then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
  perform 1 from public.products where id = operation.product_id for update;
  if not found then raise exception 'Produkt entfernt.' using errcode = '23514'; end if;
  select * into operation from public.file_operations where id = p_operation_id for update;
  if operation.state not in ('uploading', 'attached') then raise exception 'Dateivorgang beendet.' using errcode = '23514'; end if;
  update public.file_operations set validation_started_at = coalesce(validation_started_at, now())
    where id = p_operation_id returning * into operation;
  return operation;
end $$;

create or replace function public.attach_document_upload(p_operation_id uuid, p_name text, p_doc_type text, p_description text)
returns public.documents language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations; result public.documents;
begin
  select * into operation from public.file_operations where id = p_operation_id;
  if not found or not public.is_company_member(operation.manufacturer_id) then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
  perform 1 from public.products where id = operation.product_id for update;
  if not found then raise exception 'Produkt entfernt.' using errcode = '23514'; end if;
  select * into operation from public.file_operations where id = p_operation_id for update;
  if not operation.validated or operation.purpose <> 'document' or operation.state not in ('uploading','attached') then
    raise exception 'Datei nicht verwendbar.' using errcode = '23514';
  end if;
  select * into result from public.documents where file_path = operation.file_path order by id limit 1;
  if found then return result; end if;
  if length(p_name) > 2000 or length(p_doc_type) > 2000 or length(p_description) > 2000 then
    raise exception 'Dokumentangaben zu lang.' using errcode = '22023';
  end if;
  insert into public.documents(product_id, name, doc_type, description, file_path, file_name)
    values(operation.product_id, coalesce(nullif(btrim(p_name),''),operation.file_name),p_doc_type,p_description,operation.file_path,operation.file_name)
    returning * into result;
  return result;
end $$;

create or replace function public.mark_file_validated(p_operation_id uuid, p_owner_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations;
begin
  select * into operation from public.file_operations where id = p_operation_id for update;
  if not found or not exists(select 1 from public.manufacturer_memberships where manufacturer_id=operation.manufacturer_id and user_id=p_owner_id) then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
  if operation.state not in ('uploading','attached') or operation.validation_started_at is null then
    raise exception 'Datei nicht zur Prüfung gesperrt.' using errcode = '23514';
  end if;
  if not exists(select 1 from storage.objects where bucket_id = 'produkt-dokumente' and name = operation.file_path) then
    raise exception 'Datei fehlt.' using errcode = '23514';
  end if;
  update public.file_operations set validated = true where id = p_operation_id;
end $$;
