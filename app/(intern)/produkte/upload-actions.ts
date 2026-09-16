"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createFileVerifier } from "@/lib/supabase/verifier";
import { completeDocumentUpload, completeImageUpload, type UploadMeta } from "@/lib/services/upload-completion";
import { bereinigeDatei, bereinigeProduktdateien } from "@/lib/services/file-cleanup";
import { DateiFehler } from "@/lib/uploads/contract";

export async function uploadAbschliessen(operationId: string, productId: string, expectedPath: string | null, meta: UploadMeta) {
  const supabase = await createClient();
  try {
    const op = await supabase.from("file_operations").select("purpose,product_id").eq("id", operationId).single();
    if (op.error || op.data.product_id !== productId) throw new Error("Zugriff verweigert.");
    const verifier = createFileVerifier();
    if (op.data.purpose === "image") await completeImageUpload(supabase, verifier, operationId, expectedPath);
    else {
      if (!meta || [meta.name, meta.docType, meta.description].some(v => v !== null && (typeof v !== "string" || v.length > 2000))) throw new DateiFehler("Dokumentangaben sind zu lang oder ungültig.");
      await completeDocumentUpload(supabase, verifier, operationId, meta);
    }
    return { ok: true, error: null };
  } catch (error) {
    // Bereits gebundene Dateien sind durch begin_file_cleanup vor Kompensation geschützt.
    try { await bereinigeDatei(supabase, operationId); } catch { /* Bezug bleibt bestehen. */ }
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    return { ok: false, error: error instanceof DateiFehler ? error.message : code === "40001" ? "Das Produktbild wurde inzwischen geändert. Bitte neu laden und erneut versuchen." : "Upload nicht bestätigt. Bitte den aktuellen Stand prüfen. Offene Dateien können unter den Dateivorgängen bereinigt werden." };
  } finally {
    revalidatePath("/produkte"); revalidatePath(`/produkte/${productId}`);
  }
}

export async function produktbildEntfernen(productId: string, expectedPath: string) {
  const supabase = await createClient();
  try {
    const result = await supabase.rpc("set_product_image", { p_product_id: productId, p_expected_path: expectedPath, p_new_path: null! });
    if (result.error) throw result.error;
    await bereinigeProduktdateien(supabase, productId);
    return { ok: true, error: null };
  } catch { return { ok: false, error: "Bild konnte nicht entfernt werden. Bitte neu laden und erneut versuchen." }; }
  finally { revalidatePath("/produkte"); revalidatePath(`/produkte/${productId}`); }
}
