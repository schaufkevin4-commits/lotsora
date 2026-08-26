import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getProdukt,
  getMaterialien,
  getTextildaten,
  getNachhaltigkeit,
} from "@/lib/services/products";
import { getDokumenteMitUrl } from "@/lib/services/documents";
import { ProduktFormular } from "./ProduktFormular";
import { DokumenteAbschnitt } from "./DokumenteAbschnitt";
import { LoeschenButton } from "./LoeschenButton";
import { StatusBadge } from "@/components/produkte/status-badge";

export default async function ProduktEditorSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const produkt = await getProdukt(supabase, id);
  if (!produkt) notFound();

  const [materialien, textildaten, nachhaltigkeit, dokumente] = await Promise.all([
    getMaterialien(supabase, id),
    getTextildaten(supabase, id),
    getNachhaltigkeit(supabase, id),
    getDokumenteMitUrl(supabase, id),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/produkte" className="text-sm text-muted-foreground hover:underline">
          ← Zurück zu Produkte
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produkt bearbeiten</h1>
        <div className="flex items-center gap-3">
          <StatusBadge status={produkt.status} />
          <LoeschenButton id={produkt.id} name={produkt.name ?? ""} />
        </div>
      </div>

      <ProduktFormular
        produkt={produkt}
        materialien={materialien}
        textildaten={textildaten}
        nachhaltigkeit={nachhaltigkeit}
      />

      <DokumenteAbschnitt productId={id} dokumente={dokumente} />
    </div>
  );
}