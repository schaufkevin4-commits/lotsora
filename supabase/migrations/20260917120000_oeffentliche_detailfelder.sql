-- N3/F08: bestehende öffentliche Felder beibehalten, künftige Spalten nicht
-- automatisch freigeben. RLS und Rechte von authenticated bleiben unverändert.
begin;
revoke select on public.product_materials, public.product_textile_data,
  public.product_sustainability from anon;
grant select (id, product_id, material_name, percentage, created_at)
  on public.product_materials to anon;
grant select (product_id, origin_country, color, size, care_instructions, wash_instructions)
  on public.product_textile_data to anon;
grant select (product_id, recycling_notes, repair_notes, disposal_notes, reusable_materials)
  on public.product_sustainability to anon;
commit;
