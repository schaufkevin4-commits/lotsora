-- P2-1-Nachprüfung: keine andere Auswahl durch einen bestehenden Auftrag ersetzen.
create or replace function public.start_account_deletion(p_actor_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare company_id uuid; job public.deletion_jobs;
begin
  select manufacturer_id into company_id from public.manufacturer_memberships where user_id=p_actor_id;
  perform 1 from public.manufacturers where id=company_id for update;
  perform 1 from auth.users where id=p_actor_id for update;
  if not found then raise exception 'Konto nicht gefunden.' using errcode='42501'; end if;
  if exists(select 1 from public.manufacturers where user_id=p_actor_id) then
    raise exception 'Bitte zuerst die Firmenverantwortung übertragen oder die Firma ausdrücklich löschen.' using errcode='23514';
  end if;
  select * into job from public.deletion_jobs where actor_id=p_actor_id and state='pending';
  if found then
    if job.delete_self then return job.id; end if;
    raise exception 'Bitte zuerst den offenen Firmenlöschauftrag abschließen.' using errcode='23514';
  end if;
  insert into public.deletion_jobs(actor_id,delete_members,delete_self) values(p_actor_id,false,true) returning * into job;
  insert into private.deletion_accounts values(job.id,p_actor_id,true);
  delete from public.manufacturer_memberships where user_id=p_actor_id;
  return job.id;
end $$;

create or replace function public.advance_deletion_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare job public.deletion_jobs;
begin
  select * into job from public.deletion_jobs where id=p_job_id for update;
  if not found then raise exception 'Löschauftrag nicht gefunden.' using errcode='22023'; end if;
  if job.state='completed' then return true; end if;
  delete from private.deletion_files f where job_id=job.id
    and not exists(select 1 from storage.objects o where o.bucket_id='produkt-dokumente' and o.name=f.file_path);
  if exists(select 1 from private.deletion_files where job_id=job.id) then return false; end if;
  insert into private.retired_file_paths(path_hash) select sha256(convert_to(file_path,'UTF8'))
    from public.file_operations where manufacturer_id=job.company_id on conflict do nothing;
  delete from public.file_operations where manufacturer_id=job.company_id;
  update public.file_operations set owner_id=null where owner_id in(
    select a.user_id from private.deletion_accounts a where a.job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id));
  update public.company_invitations set accepted_by=null where accepted_by in(
    select a.user_id from private.deletion_accounts a where a.job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id));
  -- Nach einer Verantwortungsübergabe sind alte Einladungen bereits ungültig.
  -- Die Kontolöschung entfernt auch den darin verbliebenen Erstellerbezug.
  delete from public.company_invitations where created_by in(
    select a.user_id from private.deletion_accounts a where a.job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id));
  delete from private.deletion_accounts a where job_id=job.id and not exists(select 1 from auth.users u where u.id=a.user_id);
  if exists(select 1 from private.deletion_accounts where job_id=job.id) then return false; end if;
  update public.deletion_jobs set actor_id=null where actor_id is not null and not exists(select 1 from auth.users u where u.id=actor_id);
  update public.deletion_jobs set state='completed',completed_at=now() where id=job.id;
  return true;
end $$;
