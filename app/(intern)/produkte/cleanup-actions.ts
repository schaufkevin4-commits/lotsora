"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bereinigeDatei } from "@/lib/services/file-cleanup";

export type CleanupState = { error: string | null };

export async function dateiBereinigen(
  operationId: string, productId: string, _previous: CleanupState, _formData: FormData,
): Promise<CleanupState> {
  void _previous; void _formData;
  const supabase = await createClient();
  let complete = false;
  try { complete = (await bereinigeDatei(supabase, operationId)).complete; }
  catch { /* Dauerhafter Vorgang bleibt sichtbar. */ }
  revalidatePath("/produkte");
  revalidatePath(`/produkte/${productId}`);
  return { error: complete ? null : "Die Datei konnte noch nicht vollständig gelöscht werden. Bitte erneut versuchen." };
}
