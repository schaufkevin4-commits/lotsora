"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProdukt, updateProdukt, leiteStatusAb } from "@/lib/services/products";

export async function produktSpeichern(id: string, formData: FormData) {
  const supabase = await createClient();

  const basis = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim() || null,
  };

  // aktuellen Status laden, damit „Veröffentlicht" nicht versehentlich überschrieben wird
  const aktuell = await getProdukt(supabase, id);
  const status = leiteStatusAb(basis, aktuell?.status ?? "entwurf");

  await updateProdukt(supabase, id, { ...basis, status });

  revalidatePath(`/produkte/${id}`);
  revalidatePath("/produkte");
  revalidatePath("/dashboard");
}