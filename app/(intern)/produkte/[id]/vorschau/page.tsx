import { notFound } from "next/navigation";
import { ProduktPass } from "@/components/produkte/produkt-pass";
import { getVorschauPass } from "@/lib/services/products";
import { createClient } from "@/lib/supabase/server";

export default async function ProduktVorschauSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const pass = await getVorschauPass(supabase, id);

  if (!pass) notFound();

  return <ProduktPass pass={pass} vorschau />;
}
