-- Öffentliche Bildrechte unabhängig von der Besuchersession und ohne
-- Verwechslung von products.name mit dem Storage-Objektnamen prüfen.
create function public.is_public_product_image(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.products p where p.image_url = p_path and p.status = 'veroeffentlicht');
$$;
revoke all on function public.is_public_product_image(text) from public;
grant execute on function public.is_public_product_image(text) to anon, authenticated;
alter policy "Produktbild: veroeffentlicht lesen" on storage.objects
  using (bucket_id = 'produkt-dokumente' and public.is_public_product_image(name));
