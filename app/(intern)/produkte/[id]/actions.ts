"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getProdukt,
  updateProdukt,
  deleteProdukt,
  leiteStatusAb,
  checkMaterialShares,
  saveMaterialien,
  saveTextildaten,
  saveNachhaltigkeit,
  type MaterialInput,
} from "@/lib/services/products";

export type ProduktFormState = { ok: boolean; error: string | null };

// "80" oder "80,5" ⇒ Zahl. Ungültiges ⇒ 0.
function zuProzent(wert: FormDataEntryValue | undefined): number {
  const n = Number(String(wert ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
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
  _prev: ProduktFormState,
  formData: FormData,
): Promise<ProduktFormState> {
  const supabase = await createClient();

  const basis = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim() || null,
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

  // PP-012 hart: über 100 % wird gar nicht gespeichert (klare Rückmeldung).
  const check = checkMaterialShares(materialien);
  if (check.isOverLimit) {
    return { ok: false, error: check.message };
  }

  try {
    const aktuell = await getProdukt(supabase, id);
    const status = leiteStatusAb(basis, aktuell?.status ?? "entwurf");
    await updateProdukt(supabase, id, { ...basis, status });
    await saveMaterialien(supabase, id, materialien);
    await saveTextildaten(supabase, id, textildaten);
    await saveNachhaltigkeit(supabase, id, nachhaltigkeit);
  } catch {
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath(`/produkte/${id}`);
  revalidatePath("/produkte");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function produktLoeschen(id: string) {
  const supabase = await createClient();
  await deleteProdukt(supabase, id);
  revalidatePath("/produkte");
  revalidatePath("/dashboard");
  redirect("/produkte");
}