-- P2-1: explizite Selbstbedienung, dauerhafte Aufträge statt Auth-Löschkaskade.
-- Start nur über den Server nach erneuter Passwortprüfung. DB und Storage sind
-- getrennte Systeme: keine Storage-Metadaten per SQL löschen.
create table public.deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  company_id uuid unique,
  delete_members boolean not null,
  delete_self boolean not null,
  state text not null default 'pending' check (state in ('pending','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.deletion_jobs enable row level security;
revoke all on public.deletion_jobs from public,anon,authenticated;
grant select on public.deletion_jobs to authenticated;
grant all on public.deletion_jobs to service_role;
create policy "Loeschauftrag: Antragsteller liest" on public.deletion_jobs
  for select to authenticated using (actor_id = (select auth.uid()));
create unique index deletion_jobs_pending_actor on public.deletion_jobs(actor_id) where state='pending';

create table private.deletion_files (
  job_id uuid not null references public.deletion_jobs(id) on delete cascade,
  file_path text not null,
  primary key(job_id,file_path)
);
create table private.deletion_accounts (
  job_id uuid not null references public.deletion_jobs(id) on delete cascade,
  user_id uuid not null unique,
  is_requester boolean not null,
  primary key(job_id,user_id)
);
-- Keine Dateinamen/Personenbezüge nach Abschluss behalten, Pfade dennoch sperren.
create table private.retired_file_paths (path_hash bytea primary key);
revoke all on private.deletion_files, private.deletion_accounts, private.retired_file_paths from public,anon,authenticated;
alter table public.file_operations alter column owner_id drop not null;

create function private.reject_retired_file_path() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from private.retired_file_paths where path_hash=sha256(convert_to(new.file_path,'UTF8'))) then
    raise exception 'Dieser Dateipfad wurde bereits verwendet.' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function private.reject_retired_file_path() from public,anon,authenticated;
create trigger file_operations_retired_path before insert or update of file_path on public.file_operations
  for each row execute function private.reject_retired_file_path();

-- Ein zur Kontolöschung vorgemerktes Konto darf während eines Wiederholungsversuchs
-- nicht einer anderen Firma beitreten oder Verantwortung übernehmen.
create function private.reject_deleting_account() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from auth.users where id=new.user_id for update;
  if exists(select 1 from private.deletion_accounts where user_id=new.user_id) then
    raise exception 'Dieses Konto wird gelöscht und kann keiner Firma beitreten.' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.reject_deleting_account() from public,anon,authenticated;
create trigger memberships_pending_account before insert or update of user_id on public.manufacturer_memberships
  for each row execute function private.reject_deleting_account();
create trigger manufacturers_pending_account before insert or update of user_id on public.manufacturers
  for each row execute function private.reject_deleting_account();

create function private.company_deletion_preview(p_company_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  with snapshot as (
    select jsonb_build_object(
      'companyId',m.id,'companyName',m.company_name,'ownerId',m.user_id,
      'members',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'owner',u.id=m.user_id) order by u.id)
        from public.manufacturer_memberships s join auth.users u on u.id=s.user_id where s.manufacturer_id=m.id),'[]'::jsonb),
      'products',(select count(*) from public.products where manufacturer_id=m.id),
      'published',(select count(*) from public.products where manufacturer_id=m.id and status='veroeffentlicht'),
      'files',(select count(*) from public.file_operations where manufacturer_id=m.id and state<>'deleted'),
      'documents',(select count(*) from public.documents d join public.products p on p.id=d.product_id where p.manufacturer_id=m.id)
    ) as payload,
    m.updated_at,
    (select string_agg(p.id::text||p.updated_at::text,',' order by p.id) from public.products p where manufacturer_id=m.id) as products_version,
    (select string_agg(f.id::text||f.state,',' order by f.id) from public.file_operations f where manufacturer_id=m.id) as files_version
    from public.manufacturers m where m.id=p_company_id
  ) select payload || jsonb_build_object('fingerprint',encode(sha256(convert_to(payload::text||updated_at::text||coalesce(products_version,'')||coalesce(files_version,''),'UTF8')),'hex')) from snapshot;
$$;
revoke all on function private.company_deletion_preview(uuid) from public,anon,authenticated;
create function public.company_deletion_preview(p_company_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_company_owner(p_company_id) then raise exception 'Nur Firmenverantwortliche dürfen die Firma löschen.' using errcode='42501'; end if;
  return private.company_deletion_preview(p_company_id);
end $$;
revoke all on function public.company_deletion_preview(uuid) from public,anon;
grant execute on function public.company_deletion_preview(uuid) to authenticated;

create function public.start_company_deletion(p_actor_id uuid,p_company_id uuid,p_fingerprint text,p_delete_members boolean,p_delete_self boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare company public.manufacturers; job public.deletion_jobs;
begin
  select * into company from public.manufacturers where id=p_company_id for update;
  if not found then
    select * into job from public.deletion_jobs where company_id=p_company_id and actor_id=p_actor_id;
    if found and job.delete_members=p_delete_members and job.delete_self=p_delete_self then return job.id; end if;
    raise exception 'Firma nicht gefunden oder kein Zugriff.' using errcode='42501';
  end if;
  if company.user_id is distinct from p_actor_id then raise exception 'Nur Firmenverantwortliche dürfen die Firma löschen.' using errcode='42501'; end if;
  if p_delete_members is null or p_delete_self is null then raise exception 'Bitte beide Kontoentscheidungen treffen.' using errcode='22023'; end if;
  -- Gleiche Produkt-/Dateisperren wie Upload und reguläre Produktlöschung.
  perform 1 from public.products where manufacturer_id=p_company_id order by id for update;
  perform 1 from public.file_operations where manufacturer_id=p_company_id order by id for update;
  perform 1 from auth.users where id in(select user_id from public.manufacturer_memberships where manufacturer_id=p_company_id) order by id for update;
  if p_fingerprint is distinct from private.company_deletion_preview(p_company_id)->>'fingerprint' then
    raise exception 'Firma, Team oder Daten wurden geändert. Bitte Übersicht neu laden und erneut bestätigen.' using errcode='40001';
  end if;
  insert into public.deletion_jobs(actor_id,company_id,delete_members,delete_self)
    values(p_actor_id,p_company_id,p_delete_members,p_delete_self) returning * into job;
  insert into private.deletion_accounts(job_id,user_id,is_requester)
    select job.id,user_id,user_id=p_actor_id from public.manufacturer_memberships where manufacturer_id=p_company_id
    and ((user_id=p_actor_id and p_delete_self) or (user_id<>p_actor_id and p_delete_members));
  insert into private.deletion_files(job_id,file_path)
    select job.id,file_path from public.file_operations where manufacturer_id=p_company_id;
  -- Ein atomarer Commit entfernt öffentliche Daten UND sämtliche Mitgliedschaften.
  -- Auth-Löschung und physische Dateien folgen anhand des unabhängig erhaltenen Auftrags.
  delete from public.manufacturers where id=p_company_id;
  return job.id;
end $$;

create function public.start_account_deletion(p_actor_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare company_id uuid; job_id uuid;
begin
  select manufacturer_id into company_id from public.manufacturer_memberships where user_id=p_actor_id;
  perform 1 from public.manufacturers where id=company_id for update;
  perform 1 from auth.users where id=p_actor_id for update;
  if not found then raise exception 'Konto nicht gefunden.' using errcode='42501'; end if;
  if exists(select 1 from public.manufacturers where user_id=p_actor_id) then
    raise exception 'Bitte zuerst die Firmenverantwortung übertragen oder die Firma ausdrücklich löschen.' using errcode='23514';
  end if;
  select id into job_id from public.deletion_jobs where actor_id=p_actor_id and state='pending';
  if found then return job_id; end if;
  insert into public.deletion_jobs(actor_id,delete_members,delete_self) values(p_actor_id,false,true) returning id into job_id;
  insert into private.deletion_accounts values(job_id,p_actor_id,true);
  delete from public.manufacturer_memberships where user_id=p_actor_id;
  return job_id;
end $$;

-- Nur serverseitiger Worker. Auch nach Timeout/Neustart wird die tatsächliche
-- Abwesenheit geprüft; ein leeres Storage-remove ist allein kein Erfolgsbeleg.
create function public.advance_deletion_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare job public.deletion_jobs;
begin
  select * into job from public.deletion_jobs where id=p_job_id for update;
  if not found then raise exception 'Löschauftrag nicht gefunden.' using errcode='22023'; end if;
  if job.state='completed' then return true; end if;
  delete from private.deletion_files f where job_id=job.id
    and not exists(select 1 from storage.objects o where o.bucket_id='produkt-dokumente' and o.name=f.file_path);
  if exists(select 1 from private.deletion_files where job_id=job.id) then return false; end if;
  -- Geprüft leere Dateibestände: nur Hash-Reservierungen, keine Originalnamen.
  insert into private.retired_file_paths(path_hash) select sha256(convert_to(file_path,'UTF8'))
    from public.file_operations where manufacturer_id=job.company_id on conflict do nothing;
  delete from public.file_operations where manufacturer_id=job.company_id;
  -- Konten erst nach Dateibereinigung, Antragsteller zuletzt.
  update public.file_operations set owner_id=null where owner_id in(
    select a.user_id from private.deletion_accounts a where a.job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id));
  update public.company_invitations set accepted_by=null where accepted_by in(
    select a.user_id from private.deletion_accounts a where a.job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id));
  delete from private.deletion_accounts a where job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id);
  if exists(select 1 from private.deletion_accounts where job_id=job.id) then return false; end if;
  update public.deletion_jobs set actor_id=null where actor_id is not null and not exists(select 1 from auth.users u where u.id=actor_id);
  update public.deletion_jobs set state='completed',completed_at=now() where id=job.id;
  return true;
end $$;

create function public.deletion_job_batch(p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.deletion_jobs where id=p_job_id and state='pending') then
    return jsonb_build_object('files','[]'::jsonb,'accounts','[]'::jsonb);
  end if;
  return jsonb_build_object(
    'files',coalesce((select jsonb_agg(file_path) from (select file_path from private.deletion_files where job_id=p_job_id order by file_path limit 50) f),'[]'::jsonb),
    'accounts',case when exists(select 1 from private.deletion_files where job_id=p_job_id) then '[]'::jsonb else
      coalesce((select jsonb_agg(user_id) from (select user_id from private.deletion_accounts a where job_id=p_job_id
        and (not is_requester or not exists(select 1 from private.deletion_accounts b where b.job_id=p_job_id and not b.is_requester))
        order by user_id limit 50) accounts),'[]'::jsonb) end);
end $$;

revoke all on function public.start_company_deletion(uuid,uuid,text,boolean,boolean), public.start_account_deletion(uuid),
  public.advance_deletion_job(uuid),public.deletion_job_batch(uuid) from public,anon,authenticated;
grant execute on function public.start_company_deletion(uuid,uuid,text,boolean,boolean), public.start_account_deletion(uuid),
  public.advance_deletion_job(uuid),public.deletion_job_batch(uuid) to service_role;
