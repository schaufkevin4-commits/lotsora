import { getOffeneDateivorgaenge } from "@/lib/services/file-cleanup";
import { FileCleanupPanel } from "@/components/produkte/file-cleanup-panel";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEditorStand,
  getMissingRequiredFields,
  checkMaterialShares,
} from "@/lib/services/products";
import { getDokumenteMitUrl, erzeugeSignierteUrl } from "@/lib/services/documents";
import { ProductImage } from "@/components/produkte/product-image";
import { ProduktFormular } from "./ProduktFormular";
import { DokumenteAbschnitt } from "./DokumenteAbschnitt";
import { LoeschenButton } from "./LoeschenButton";
import { StatusBadge } from "@/components/produkte/status-badge";
import { VeroeffentlichenAbschnitt } from "./VeroeffentlichenAbschnitt";
import { buildPassUrl, generateQrSvg } from "@/lib/qr";
import { QrCodeAbschnitt } from "./QrCodeAbschnitt";
import { EditorProvider } from "./EditorProvider";
import { datenluecken } from "@/lib/services/completeness";

export default async function ProduktEditorSeite({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ neu?: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const offeneDateivorgaenge = await getOffeneDateivorgaenge(supabase, id);

  const stand = await getEditorStand(supabase, id);
  if (!stand) notFound();
  const { produkt, materialien, textildaten, nachhaltigkeit } = stand;
  const dokumente = await getDokumenteMitUrl(supabase, id);
  const materialInputs = materialien.map((material) => ({
    materialName: material.material_name,
    percentage: Number(material.percentage),
  }));
  const fehlendePflichtfelder = getMissingRequiredFields(produkt);
  const materialSumme = checkMaterialShares(materialInputs).sum;
  const luecken = datenluecken(produkt, materialien, textildaten, nachhaltigkeit);

  // QR-Code: für veröffentlichte Produkte (PP-016) dauerhafte, öffentliche
  // Pass-ID verwenden. Interne Relationen und Editor-URLs behalten die UUID.
  const istVeroeffentlicht = produkt.status === "veroeffentlicht";
  const passUrl = istVeroeffentlicht ? buildPassUrl(produkt.public_id) : null;
  const qrSvg = passUrl ? await generateQrSvg(passUrl) : null;

  return (
    <EditorProvider key={id} id={id} version={produkt.editor_version}>
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

      <aside className="space-y-1 rounded-lg border p-4 text-sm" aria-label="Datenvollständigkeit">
        <p className="font-medium">Gespeicherte Angaben: {luecken.label}</p>
        {luecken.required.length > 0 && <p>Pflichtangaben fehlen: {luecken.required.join(", ")}.</p>}
        {luecken.optional.length > 0 && <p>Optional ergänzen: {luecken.optional.join(", ")}.</p>}
        <p className="text-muted-foreground">Orientierung zu Pflichtangaben, Material, Herkunft, Pflege und Kreislauf. Keine fachliche Prüfung. Optionale Lücken verhindern die Veröffentlichung nicht.</p>
      </aside>

      <ProduktFormular
        guided={(await searchParams).neu === "1"}
        produkt={produkt}
        materialien={materialien}
        textildaten={textildaten}
        nachhaltigkeit={nachhaltigkeit}
      />

      <FileCleanupPanel operations={offeneDateivorgaenge} />
      <ProductImage productId={id} path={produkt.image_url} url={produkt.image_url ? await erzeugeSignierteUrl(supabase, produkt.image_url) : null} />
      <div id="dokumente"><DokumenteAbschnitt productId={id} dokumente={dokumente} /></div>

      <VeroeffentlichenAbschnitt
        productId={produkt.id}
        status={produkt.status}
        fehlendePflichtfelder={fehlendePflichtfelder}
        materialSumme={materialSumme}
      />

      <QrCodeAbschnitt svg={qrSvg} passUrl={passUrl} />
    </div>
    </EditorProvider>
  );
}
