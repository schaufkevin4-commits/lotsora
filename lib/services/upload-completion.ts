import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { validateFile } from "@/lib/uploads/validate";
import { checkFileMetadata, type FilePurpose } from "@/lib/uploads/contract";
import { DOKUMENTE_BUCKET, bereinigeUploadDateiname, type Dokument } from "./documents";
import { bereinigeDatei, bereinigeProduktdateien } from "./file-cleanup";
type DB = SupabaseClient<Database>;
export type UploadMeta = { name: string | null; docType: string | null; description: string | null };
export class DokumentUploadFehler extends Error {}

export async function validateStoredUpload(supabase: DB, verifier: DB, operationId: string) {
  const user = await supabase.auth.getUser();
  if (user.error || !user.data.user) throw new Error("Anmeldung erforderlich.");
  const frozen = await supabase.rpc("begin_file_validation", { p_operation_id: operationId });
  if (frozen.error) throw frozen.error;
  const operation = frozen.data;
  // begin_file_validation prüft die aktuelle Firmenmitgliedschaft. Der
  // ursprüngliche Uploader kann inzwischen aus dem Team entfernt worden sein.
  if (!operation.validated) {
    const downloaded = await supabase.storage.from(DOKUMENTE_BUCKET).download(operation.file_path);
    if (downloaded.error) throw downloaded.error;
    const blob = downloaded.data;
    await validateFile(new Uint8Array(await blob.arrayBuffer()), operation.file_name, blob.type, operation.purpose as FilePurpose);
    const marked = await verifier.rpc("mark_file_validated", { p_operation_id: operation.id, p_owner_id: user.data.user.id });
    if (marked.error) throw marked.error;
  }
  return operation;
}

export async function completeDocumentUpload(supabase: DB, verifier: DB, operationId: string, meta: UploadMeta): Promise<Dokument> {
  const operation = await validateStoredUpload(supabase, verifier, operationId);
  if (operation.purpose !== "document") throw new Error("Falscher Dateizweck.");
  const inserted = await supabase.rpc("attach_document_upload", { p_operation_id: operationId, p_name: meta.name!, p_doc_type: meta.docType!, p_description: meta.description! });
  if (inserted.error) {
    // Erfolgreicher Commit mit verlorener Antwort: Dokument sicher wiederfinden.
    const existing = await supabase.from("documents").select().eq("file_path", operation.file_path).order("id").limit(1).maybeSingle();
    if (existing.data) return existing.data;
    throw inserted.error;
  }
  return inserted.data;
}

export async function completeImageUpload(supabase: DB, verifier: DB, operationId: string, expectedPath: string | null) {
  const operation = await validateStoredUpload(supabase, verifier, operationId);
  if (operation.purpose !== "image") throw new Error("Falscher Dateizweck.");
  const saved = await supabase.rpc("set_product_image", { p_product_id: operation.product_id, p_expected_path: expectedPath!, p_new_path: operation.file_path });
  if (saved.error) throw saved.error;
  return bereinigeProduktdateien(supabase, operation.product_id);
}

// Server-/Integrationseinstieg. Die Browseroberfläche lädt direkt in Storage.
export async function ladeDokumentHoch(supabase: DB, productId: string, datei: File, meta: UploadMeta, verifier: DB): Promise<Dokument> {
  checkFileMetadata(datei.name, datei.type, datei.size, "document");
  const reserved = await supabase.rpc("reserve_file_upload", { p_product_id: productId, p_file_name: bereinigeUploadDateiname(datei.name), p_purpose: "document" });
  if (reserved.error) throw reserved.error;
  const operation = reserved.data;
  try {
    const uploaded = await supabase.storage.from(DOKUMENTE_BUCKET).upload(operation.file_path, await datei.arrayBuffer(), { contentType: datei.type, upsert: false });
    if (uploaded.error) throw uploaded.error;
    return await completeDocumentUpload(supabase, verifier, operation.id, meta);
  } catch {
    const existing = await supabase.from("documents").select().eq("file_path", operation.file_path).maybeSingle();
    if (existing.data) return existing.data;
    if (!existing.error) {
      try {
        if ((await bereinigeDatei(supabase, operation.id)).complete) throw new DokumentUploadFehler("Upload fehlgeschlagen. Die Datei wurde bereinigt; bitte erneut versuchen.");
      } catch (error) { if (error instanceof DokumentUploadFehler) throw error; }
    }
    throw new DokumentUploadFehler("Upload nicht bestätigt. Der Dateivorgang bleibt gespeichert und kann unter den offenen Dateivorgängen bereinigt werden; unbestätigte Uploads erscheinen dort nach 15 Minuten.");
  }
}
