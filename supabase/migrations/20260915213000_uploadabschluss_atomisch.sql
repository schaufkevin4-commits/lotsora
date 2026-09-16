-- Derselbe geprüfte Upload erzeugt auch bei parallelem Abschluss nur ein Dokument.
create function public.attach_document_upload(p_operation_id uuid, p_name text, p_doc_type text, p_description text)
returns public.documents language plpgsql security definer set search_path = '' as $$
declare operation public.file_operations; result public.documents;
begin
  select * into operation from public.file_operations where id = p_operation_id;
  if not found or operation.owner_id is distinct from auth.uid() then raise exception 'Zugriff verweigert.' using errcode = '42501'; end if;
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
revoke all on function public.attach_document_upload(uuid,text,text,text) from public, anon;
grant execute on function public.attach_document_upload(uuid,text,text,text) to authenticated;
