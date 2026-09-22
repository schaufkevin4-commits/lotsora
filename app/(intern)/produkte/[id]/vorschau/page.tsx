import { notFound } from "next/navigation";
import Link from "next/link";
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

  return <div className="space-y-4"><Link href={`/produkte/${id}#veroeffentlichung`} className="text-sm underline">← Zurück zur Veröffentlichung</Link><ProduktPass pass={pass} vorschau /></div>;
}
