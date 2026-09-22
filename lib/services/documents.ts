// lib/services/documents.ts
// Fachlogik + Datenzugriff rund um Produkt-Dokumente (Service-Schicht, PP-021 E2).
// Setzt PP-015 (Supabase Storage) um; RLS (PP-017) + owns_product sichern, dass
// nur der Hersteller des Produkts Dateien/Zeilen sieht und ändert.
// Sichtbarkeit bleibt in Tag 23 immer Default 'intern' (A-020) – der Umschalter
// intern/öffentlich + Warnhinweis (PP-013 E7) kommt in Tag 24.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { LoeschzielFehler } from "@/lib/services/delete-error";
import { bereinigeDatei, type LoeschErgebnis } from "@/lib/services/file-cleanup";
import { oeffentlicherDokumentpfad } from "@/lib/public-file-paths";

type DB = SupabaseClient<Database>;

export type Dokument = Database["public"]["Tables"]["documents"]["Row"];
export type DokumentSichtbarkeit = Dokument["visibility"];

// Warnung aus PP-013 E7, ergänzt um die bewusste Gesamtfreigabe aus P2-4.
export const FREIGABE_WARNUNG =
  "Bitte prüfen Sie das Dokument vor der Freigabe auf personenbezogene Daten – zum Beispiel Ansprechpartner-Namen, Unterschriften und E-Mail-Adressen (häufig in Zertifikaten und Prüfberichten). Ausgewählte Dokumente werden erst mit der nächsten Veröffentlichung für jeden über den QR-Code sichtbar. Bereits veröffentlichte Dokumente bleiben bis zur Aktualisierung oder Rücknahme des Passes sichtbar.";

// Privater Storage-Bucket (siehe Migration dokumente_storage). Nicht öffentlich.
export const DOKUMENTE_BUCKET = "produkt-dokumente";

// Auswahl-Dokumenttypen (DATENMODELL.md). doc_type ist Freitext in der DB,
// die UI bietet diese Liste als Auswahl an.
export const DOKUMENT_TYPEN = [
  "Zertifikat",
  "Prüfbericht",
  "Datenblatt",
  "Pflegeinformation",
  "Produktinformation",
  "Anleitung",
  "Nachweis",
  "Sonstiges Dokument",
] as const;

export { MAX_DATEI_BYTES } from "@/lib/uploads/contract";

// --- Pure Helfer (testbar, ohne Server-Abhängigkeiten) -----------------------

// FormData ist nicht vertrauenswürdig. Nur die zwei im Datenmodell erlaubten
// Werte werden akzeptiert; alles andere wird als ungültig verworfen.
export function parseDokumentSichtbarkeit(
  wert: unknown,
): DokumentSichtbarkeit | null {
  return wert === "intern" || wert === "oeffentlich" ? wert : null;
}

// Dateinamen für einen Storage-Key säubern: nur a–z, 0–9, . _ - bleiben,
// alles andere wird zu "-". Mehrfach-"-" werden zusammengefasst.
export function bereinigeDateiname(name: string): string {
  const sauber = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return sauber.length > 0 ? sauber : "datei";
}

// Storage-Pfad: <product_id>/<uuid>-<dateiname>. Der erste Ordner ist die
// product_id – genau das prüft die Storage-RLS (owns_product). Die uuid ist
// als Parameter überschreibbar, damit der Pfadbau testbar bleibt.
export function baueDateipfad(
  productId: string,
  fileName: string,
  uuid: string = crypto.randomUUID(),
): string {
  return `${productId}/${uuid}-${bereinigeDateiname(fileName)}`;
}

// --- Datenzugriff (RLS filtert automatisch auf eigene Produkte) --------------

export type DokumentMitUrl = Dokument & { signedUrl: string | null };
export type OeffentlichesDokument = Pick<Dokument, "id" | "name" | "doc_type"> & {
  url: string | null;
};

// Alle Dokumente eines Produkts, neueste zuerst.
export async function getDokumente(
  supabase: DB,
  productId: string,
): Promise<Dokument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("product_id", productId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Wie getDokumente, aber je Dokument eine kurzlebige Signed-URL fürs interne
// „Öffnen" (privater Bucket → kein öffentlicher Link). Läuft mit der Nutzer-
// Session, daher gibt die Storage-RLS nur eigene Dateien frei.
export async function getDokumenteMitUrl(
  supabase: DB,
  productId: string,
): Promise<DokumentMitUrl[]> {
  const dokumente = await getDokumente(supabase, productId);
  return Promise.all(
    dokumente.map(async (d) => ({
      ...d,
      signedUrl: d.file_path
        ? await erzeugeSignierteUrl(supabase, d.file_path)
        : null,
    })),
  );
}

// Freigegebene Dokumente für die spätere öffentliche Produktpass-Seite.
// Der Status wird hier zusätzlich zur RLS geprüft, damit auch ein eingeloggter
// Hersteller über diesen öffentlichen Lesepfad nichts Unveröffentlichtes erhält.
export async function getOeffentlicheDokumenteMitUrl(
  supabase: DB,
  productId: string,
): Promise<OeffentlichesDokument[]> {
  const { data: produkt, error: produktError } = await supabase
    .from("products")
    .select("status, public_id")
    .eq("id", productId)
    .maybeSingle();

  if (produktError) throw produktError;
  if (produkt?.status !== "veroeffentlicht") return [];

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, doc_type, file_path")
    .eq("product_id", productId)
    .eq("visibility", "oeffentlich")
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  // Stabile App-Links: Freigabe und Signatur erst beim tatsächlichen Öffnen.
  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    doc_type: d.doc_type,
    url: d.file_path ? oeffentlicherDokumentpfad(produkt.public_id, d.id) : null,
  }));
}

// Eine Signed-URL für einen Storage-Pfad (Default 1 Stunde gültig).
export async function erzeugeSignierteUrl(
  supabase: DB,
  filePath: string,
  sekunden = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .createSignedUrl(filePath, sekunden);
  if (error) return null; // fehlende Datei/Recht ⇒ einfach kein Link
  return data.signedUrl;
}

// Sichtbarkeit eines eigenen Dokuments ändern. Die documents-RLS prüft dabei
// weiterhin serverseitig, ob das Dokument zu einem Produkt des Nutzers gehört.
export async function setzeDokumentSichtbarkeit(
  supabase: DB,
  id: string,
  visibility: DokumentSichtbarkeit,
): Promise<Dokument> {
  const { data, error } = await supabase
    .from("documents")
    .update({ visibility })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// DB-Trigger sichern den Dateibezug atomar beim Entfernen des Dokuments.
// Weitere Bereinigungsversuche laufen über die offenen Dateivorgänge.
export async function loescheDokument(supabase: DB, id: string): Promise<LoeschErgebnis> {
  const removed = await supabase.from("documents").delete().eq("id", id).select("id");
  if (removed.error) throw removed.error;
  if (!removed.data?.length) throw new LoeschzielFehler("Dokument");
  try {
    const operations = await supabase.from("file_operations").select("id").eq("document_id", id).eq("state", "cleanup");
    if (operations.error) throw operations.error;
    let complete = true;
    for (const operation of operations.data ?? []) {
      try { if (!(await bereinigeDatei(supabase, operation.id)).complete) complete = false; }
      catch { complete = false; }
    }
    const remaining = await supabase.from("file_operations").select("id", { count: "exact", head: true })
      .eq("document_id", id).eq("state", "cleanup");
    return { complete: complete && !remaining.error && remaining.count === 0 };
  } catch { return { complete: false }; }
}

// Reservierungsgrenze einhalten, ohne bei langen Namen die Dateiendung zu verlieren.
export function bereinigeUploadDateiname(name: string): string {
  const clean = bereinigeDateiname(name);
  if (clean.length <= 180) return clean;
  const extension = clean.slice(clean.lastIndexOf("."));
  return clean.slice(0, 180 - extension.length) + extension;
}
