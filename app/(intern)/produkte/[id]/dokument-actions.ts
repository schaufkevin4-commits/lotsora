"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  loescheDokument,
  parseDokumentSichtbarkeit,
  setzeDokumentSichtbarkeit,
} from "@/lib/services/documents";

export type DokumentFormState = { ok: boolean; error: string | null };
export type SichtbarkeitFormState = DokumentFormState;

// Sichtbarkeit bewusst umschalten. Auch gebundene Argumente kommen letztlich
// vom Client und werden deshalb zur Laufzeit validiert. Die Eigentumsprüfung
// übernimmt zusätzlich die RLS-Policy der documents-Tabelle.
export async function dokumentSichtbarkeitAendern(
  id: string,
  productId: string,
  ziel: unknown,
  _prev: SichtbarkeitFormState,
  _formData: FormData,
): Promise<SichtbarkeitFormState> {
  void _prev;
  void _formData;

  const visibility = parseDokumentSichtbarkeit(ziel);
  if (!visibility) {
    return { ok: false, error: "Ungültige Sichtbarkeit." };
  }

  const supabase = await createClient();
  try {
    await setzeDokumentSichtbarkeit(supabase, id, visibility);
  } catch (e) {
    console.error("Sichtbarkeits-Fehler:", e);
    return {
      ok: false,
      error:
        "Sichtbarkeit konnte nicht geändert werden. Bitte erneut versuchen.",
    };
  }

  revalidatePath(`/produkte/${productId}`);
  return { ok: true, error: null };
}

// Ein Dokument löschen (Datei + Zeile). Wird aus der Liste je Zeile aufgerufen.
export async function dokumentLoeschen(id: string, productId: string, _previous: DokumentFormState, _formData: FormData): Promise<DokumentFormState> {
  void _previous; void _formData;
  const supabase = await createClient();
  try {
    const result = await loescheDokument(supabase, id);
    revalidatePath(`/produkte/${productId}`);
    revalidatePath("/produkte");
    return { ok: result.complete, error: result.complete ? null : "Dokument entfernt. Die Dateilöschung bleibt unter den offenen Dateivorgängen gespeichert." };
  } catch {
    return { ok: false, error: "Löschung konnte nicht bestätigt werden. Bitte neu laden und erneut versuchen." };
  }
}
