-- Migration: Tabellen-Rechte für die Login-Rolle (behebt Fehler 42501)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;