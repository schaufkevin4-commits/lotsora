"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bereinigeProduktdateien } from "@/lib/services/file-cleanup";
import { LoeschzielFehler } from "@/lib/services/delete-error";
import {
  getProdukt,
  deleteProdukt,
  validateMaterialShares,
  saveProdukt,
  setzeProduktVeroeffentlichung,
  type MaterialInput,
} from "@/lib/services/products";

export type ProduktFormState = { ok: boolean; error: string | null; version?: number; conflict?: boolean };

// "80" oder "80,5" ⇒ Zahl. Ungültiges wird von der Materialprüfung abgewiesen.
function zuProzent(wert: FormDataEntryValue | undefined): number {
  const n = Number(String(wert ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
}

// Leerer/whitespace Text ⇒ null, sonst getrimmter Text (für optionale Felder).
function textOderNull(wert: FormDataEntryValue | null): string | null {
  const s = String(wert ?? "").trim();
  return s.length > 0 ? s : null;
}

// Dynamische Material-Zeilen aus dem Formular lesen (Reihenfolge bleibt erhalten).
function leseMaterialien(formData: FormData): MaterialInput[] {
  const namen = formData.getAll("material_name");
  const anteile = formData.getAll("material_pct");
  return namen.map((name, i) => ({
    materialName: String(name),
    percentage: zuProzent(anteile[i]),
  }));
}

export async function produktSpeichern(
  id: string,
  expectedVersion: number,
  formData: FormData,
): Promise<ProduktFormState> {
  const supabase = await createClient();

  const basis = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim() || null,
    articleNumber: textOderNull(formData.get("article_number")),
  };

  // Nur ausgefüllte Material-Zeilen zählen — identisch zur Speicher-Logik.
  const materialien = leseMaterialien(formData).filter(
    (m) => m.materialName.trim().length > 0,
  );

  const textildaten = {
    originCountry: textOderNull(formData.get("origin_country")),
    color: textOderNull(formData.get("color")),
    size: textOderNull(formData.get("size")),
    careInstructions: textOderNull(formData.get("care_instructions")),
    washInstructions: textOderNull(formData.get("wash_instructions")),
  };

  const nachhaltigkeit = {
    recyclingNotes: textOderNull(formData.get("recycling_notes")),
    repairNotes: textOderNull(formData.get("repair_notes")),
    disposalNotes: textOderNull(formData.get("disposal_notes")),
    reusableMaterials: textOderNull(formData.get("reusable_materials")),
  };

  // PP-012 hart: alle Materialwerte prüfen, bevor eine DB-Operation startet.
  const materialFehler = validateMaterialShares(materialien);
  if (materialFehler) {
    return { ok: false, error: materialFehler };
  }

  let version: number;
  try {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) return { ok: false, error: "Ungültiger Speicherstand. Bitte neu laden.", conflict: true };
    const aktuell = await getProdukt(supabase, id);
    if (!aktuell) {
      return { ok: false, error: "Produkt nicht gefunden." };
    }

    // Autosave ändert ausschließlich den privaten Arbeitsstand.

    version = await saveProdukt(
      supabase,
      id,
      { ...basis, expectedStatus: aktuell.status, expectedVersion },
      materialien,
      textildaten,
      nachhaltigkeit,
    );
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "40001" || code === "40P01") {
      return { ok: false, conflict: true, error: "Ein anderer Stand wurde gespeichert. Ihre Eingaben bleiben hier erhalten. Sichern Sie benötigte Texte, laden Sie das Produkt neu und gleichen Sie die Änderungen ab." };
    }
    if (code === "23514" || code === "23502" || code === "22023") {
      return { ok: false, error: "Speichern abgelehnt. Bitte Pflichtfelder und Materialanteile prüfen." };
    }
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath(`/produkte/${id}`);
  revalidatePath("/produkte");
  revalidatePath("/dashboard");
  return { ok: true, error: null, version };
}

export async function produktLoeschen(id: string, _previous: ProduktFormState, _formData: FormData): Promise<ProduktFormState> {
  void _previous; void _formData;
  const supabase = await createClient();
  try { await deleteProdukt(supabase, id); }
  catch (error) { return { ok: false, error: error instanceof LoeschzielFehler ? error.message : "Löschung konnte nicht bestätigt werden. Bitte neu laden und erneut versuchen." }; }
  revalidatePath("/produkte");
  revalidatePath("/dashboard");
  redirect("/produkte");
}

export async function produktVeroeffentlichung(id: string, expectedVersion: number, publish: boolean, expectedToken: string): Promise<ProduktFormState> {
  const supabase = await createClient();
  let version: number;
  try {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) return { ok: false, error: "Ungültiger Speicherstand. Bitte neu laden.", conflict: true };
    version = await setzeProduktVeroeffentlichung(supabase, id, expectedVersion, publish, expectedToken);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "40001" || code === "40P01") return { ok: false, conflict: true, error: "Das Produkt wurde inzwischen geändert. Bitte neu laden und vor der Veröffentlichung erneut prüfen." };
    if (code === "23514") return { ok: false, error: "Statuswechsel abgelehnt. Bitte Pflichtfelder und Materialanteile prüfen." };
    return { ok: false, error: "Statuswechsel konnte nicht bestätigt werden. Bitte neu laden und den Status prüfen." };
  }

  // Freigabe bleibt gültig, auch wenn das nachgelagerte Aufräumen wiederholt werden muss.
  await bereinigeProduktdateien(supabase, id);
  revalidatePath(`/produkte/${id}`);
  revalidatePath("/produkte");
  revalidatePath("/dashboard");
  return { ok: true, error: null, version };
}
