"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getProdukt,
  updateProdukt,
  deleteProdukt,
  leiteStatusAb,
} from "@/lib/services/products";

export type ProduktFormState = { ok: boolean; error: string | null };

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

  try {
    const aktuell = await getProdukt(supabase, id);
    const status = leiteStatusAb(basis, aktuell?.status ?? "entwurf");
    await updateProdukt(supabase, id, { ...basis, status });
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