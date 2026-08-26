"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ladeDokumentHoch,
  loescheDokument,
  MAX_DATEI_BYTES,
} from "@/lib/services/documents";

export type DokumentFormState = { ok: boolean; error: string | null };

// Leerer/whitespace Text ⇒ null, sonst getrimmter Text (für optionale Felder).
function textOderNull(wert: FormDataEntryValue | null): string | null {
  const s = String(wert ?? "").trim();
  return s.length > 0 ? s : null;
}

// Ein Dokument hochladen (eigener Flow, NICHT in der Autosave-Form).
// useActionState-kompatibel: (gebundene productId, prev, formData) → State.
export async function dokumentHochladen(
  productId: string,
  _prev: DokumentFormState,
  formData: FormData,
): Promise<DokumentFormState> {
  const datei = formData.get("datei");

  if (!(datei instanceof File) || datei.size === 0) {
    return { ok: false, error: "Bitte eine Datei auswählen." };
  }
  if (datei.size > MAX_DATEI_BYTES) {
    return { ok: false, error: "Die Datei ist zu groß (maximal 10 MB)." };
  }

  const meta = {
    name: textOderNull(formData.get("dok_name")),
    docType: textOderNull(formData.get("doc_type")),
    description: textOderNull(formData.get("description")),
  };

  const supabase = await createClient();
  try {
    await ladeDokumentHoch(supabase, productId, datei, meta);
} catch (e) {
    console.error("Upload-Fehler:", e);
    return { ok: false, error: "Upload fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath(`/produkte/${productId}`);
  return { ok: true, error: null };
}

// Ein Dokument löschen (Datei + Zeile). Wird aus der Liste je Zeile aufgerufen.
export async function dokumentLoeschen(id: string, productId: string): Promise<void> {
  const supabase = await createClient();
  await loescheDokument(supabase, id);
  revalidatePath(`/produkte/${productId}`);
}