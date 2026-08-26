// lib/services/documents.ts
// Fachlogik + Datenzugriff rund um Produkt-Dokumente (Service-Schicht, PP-021 E2).
// Setzt PP-015 (Supabase Storage) um; RLS (PP-017) + owns_product sichern, dass
// nur der Hersteller des Produkts Dateien/Zeilen sieht und ändert.
// Sichtbarkeit bleibt in Tag 23 immer Default 'intern' (A-020) – der Umschalter
// intern/öffentlich + Warnhinweis (PP-013 E7) kommt in Tag 24.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export type Dokument = Database["public"]["Tables"]["documents"]["Row"];
export type DokumentSichtbarkeit = Dokument["visibility"];

// Wortlaut aus PP-013 E7. Als gemeinsame Konstante bleibt die Fachregel an
// einer Stelle und kann von Dialog und Tests verwendet werden.
export const FREIGABE_WARNUNG =
  "Bitte prüfen Sie das Dokument vor der Freigabe auf personenbezogene Daten – zum Beispiel Ansprechpartner-Namen, Unterschriften und E-Mail-Adressen (häufig in Zertifikaten und Prüfberichten). Öffentlich freigegebene Dokumente sind für jeden über den QR-Code sichtbar.";

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

// Weiche MVP-Obergrenze pro Datei (der Storage-Global-Limit liegt bei 50 MiB).
export const MAX_DATEI_BYTES = 10 * 1024 * 1024; // 10 MB

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
): Promise<DokumentMitUrl[]> {
  const { data: produkt, error: produktError } = await supabase
    .from("products")
    .select("status")
    .eq("id", productId)
    .maybeSingle();

  if (produktError) throw produktError;
  if (produkt?.status !== "veroeffentlicht") return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("product_id", productId)
    .eq("visibility", "oeffentlich")
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (d) => ({
      ...d,
      signedUrl: d.file_path
        ? await erzeugeSignierteUrl(supabase, d.file_path)
        : null,
    })),
  );
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

// Dokument hochladen: erst Datei in den Storage, dann Metadaten-Zeile.
// Schlägt der Insert fehl, wird die eben hochgeladene Datei wieder entfernt
// (keine verwaisten Objekte). visibility bleibt Default 'intern' (A-020).
export async function ladeDokumentHoch(
  supabase: DB,
  productId: string,
  datei: File,
  meta: { name: string | null; docType: string | null; description: string | null },
): Promise<Dokument> {
  const pfad = baueDateipfad(productId, datei.name);
  const bytes = await datei.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .upload(pfad, bytes, {
      contentType: datei.type || undefined,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  // Dokumentname ist Pflicht (NOT NULL) – leer ⇒ Dateiname als Fallback.
  const dokName = meta.name?.trim() || datei.name;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      product_id: productId,
      name: dokName,
      doc_type: meta.docType,
      description: meta.description,
      file_name: datei.name,
      file_path: pfad,
    })
    .select()
    .single();

  if (error) {
    // Aufräumen: hochgeladene Datei best-effort wieder löschen.
    await supabase.storage.from(DOKUMENTE_BUCKET).remove([pfad]);
    throw error;
  }
  return data;
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

// Dokument löschen: DB-Zeile (maßgeblich, RLS-geschützt) entfernen, danach die
// Storage-Datei best-effort. Ein Fehler beim Datei-Löschen ist unkritisch.
export async function loescheDokument(supabase: DB, id: string): Promise<void> {
  const { data: zeile } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;

  if (zeile?.file_path) {
    await supabase.storage.from(DOKUMENTE_BUCKET).remove([zeile.file_path]);
  }
}
