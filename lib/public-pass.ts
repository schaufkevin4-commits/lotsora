import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getOeffentlicherPass, type OeffentlicherPass } from "@/lib/services/products";
import { isValidPublicId } from "@/lib/public-id";

export type PassErgebnis =
  | { status: "verfuegbar"; pass: OeffentlicherPass }
  | { status: "nicht-verfuegbar" }
  | { status: "fehler" };

// Nur innerhalb eines Server-Renderpasses geteilt, niemals zwischen Besuchern
// oder Anfragen. Metadaten und Seite importieren dieselbe Funktion.
export const ladeOeffentlichenPass = cache(async (publicId: string): Promise<PassErgebnis> => {
  if (!isValidPublicId(publicId)) return { status: "nicht-verfuegbar" };
  try {
    const pass = await getOeffentlicherPass(createPublicClient(), publicId);
    return pass ? { status: "verfuegbar", pass } : { status: "nicht-verfuegbar" };
  } catch {
    // Keine DB-Details, Kontaktdaten oder signierten URLs an den Browser geben.
    console.error("Öffentlicher Produktpass konnte nicht geladen werden.");
    return { status: "fehler" };
  }
});
