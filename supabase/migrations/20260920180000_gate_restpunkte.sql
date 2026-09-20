-- Gate-Korrekturen: bestehende Migrationen bleiben unverändert.
begin;

-- Nur der vorhandene Cleanup-Zustand darf Storage-Löschungen erlauben.
drop policy "Dok-Datei: eigene loeschen" on storage.objects;

-- Keine latenten Erlaubnisse für spätere pauschale Tabellen-Grants behalten.
drop policy "Hersteller legt eigene Firma an" on public.manufacturers;
drop policy "Hersteller loescht eigene Firma" on public.manufacturers;

create or replace function public.revoke_company_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare company_uuid uuid;
begin
  select id into company_uuid from public.manufacturers where user_id=auth.uid() for update;
  if not found then raise exception 'Zugriff verweigert.' using errcode='42501'; end if;
  update public.company_invitations set revoked_at=now()
    where id=p_invitation_id and manufacturer_id=company_uuid
      and accepted_at is null and revoked_at is null;
  if not found then raise exception 'Offene Einladung nicht gefunden.' using errcode='22023'; end if;
end $$;

commit;
