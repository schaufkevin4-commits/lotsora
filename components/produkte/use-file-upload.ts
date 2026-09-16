"use client";
import { useActionState, useOptimistic, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkFileMetadata, DateiFehler, type FilePurpose } from "@/lib/uploads/contract";
import { bereinigeUploadDateiname, DOKUMENTE_BUCKET } from "@/lib/services/documents";
import { bereinigeDatei } from "@/lib/services/file-cleanup";
import { uploadAbschliessen } from "@/app/(intern)/produkte/upload-actions";

export function useFileUpload(productId: string, purpose: FilePurpose, expectedPath: string | null = null) {
  const cancelRequested = useRef(false);
  const controller = useRef<AbortController | null>(null);
  // Normales Transition-State würde erst mit dem Action-Ergebnis sichtbar.
  // Der Abbruchknopf muss bereits während der Übertragung bedienbar sein.
  const [canCancel, setCanCancel] = useOptimistic(false);
  const router = useRouter();
  const [state, action, pending] = useActionState(async (_previous: { ok: boolean; error: string | null }, formData: FormData) => {
    cancelRequested.current = false;
    controller.current = new AbortController();
    setCanCancel(true);
    let operationId: string | null = null;
    const supabase = createClient();
    try {
      const file = formData.get("datei");
      if (!(file instanceof File)) throw new DateiFehler("Bitte eine Datei auswählen.");
      checkFileMetadata(file.name, file.type, file.size, purpose);
      const reserved = await supabase.rpc("reserve_file_upload", { p_product_id: productId, p_file_name: bereinigeUploadDateiname(file.name), p_purpose: purpose });
      if (reserved.error) throw reserved.error;
      operationId = reserved.data.id;
      if (cancelRequested.current) throw new DateiFehler("Upload abgebrochen.");
      const session = await supabase.auth.getSession();
      if (session.error || !session.data.session) throw new Error("Anmeldung erforderlich.");
      // Raw-Body direkt an Storage; AbortSignal beendet die Übertragung.
      const uploaded = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${DOKUMENTE_BUCKET}/${reserved.data.file_path}`, {
        method: "POST", body: file, signal: controller.current.signal,
        headers: { Authorization: `Bearer ${session.data.session.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "Content-Type": file.type, "x-upsert": "false", "Cache-Control": "max-age=3600" },
      });
      if (!uploaded.ok) throw new Error("Storage-Upload fehlgeschlagen.");
      if (cancelRequested.current) throw new DateiFehler("Upload abgebrochen.");
      setCanCancel(false);
      const value = (key: string) => String(formData.get(key) ?? "").trim() || null;
      return await uploadAbschliessen(operationId, productId, expectedPath, { name: value("dok_name"), docType: value("doc_type"), description: value("description") });
    } catch (error) {
      if (operationId) { try { await bereinigeDatei(supabase, operationId); } catch { /* Auftrag bleibt vorhanden. */ } }
      return { ok: false, error: cancelRequested.current ? "Upload abgebrochen. Noch offene Dateien bleiben zur Bereinigung gespeichert." : error instanceof DateiFehler ? error.message : "Upload nicht bestätigt. Bitte erneut versuchen und offene Dateivorgänge prüfen." };
    } finally { setCanCancel(false); controller.current = null; router.refresh(); }
  }, { ok: false, error: null });
  return { state, action, pending, canCancel: pending && canCancel, cancel: () => { cancelRequested.current = true; controller.current?.abort(); } };
}
