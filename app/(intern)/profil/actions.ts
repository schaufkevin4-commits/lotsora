// app/(intern)/profil/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateMeinHersteller } from "@/lib/services/manufacturers";
import { normalizeWebsite } from "@/lib/profile";

export type ProfilState = { ok: boolean; error: string | null; website?: string | null };

export async function profilSpeichern(
  _prev: ProfilState,
  formData: FormData,
): Promise<ProfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const company_name = String(formData.get("company_name") ?? "").trim();
  if (!company_name) return { ok: false, error: "Firmenname ist ein Pflichtfeld." };

  const text = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    return v === "" ? null : v;
  };

  let website: string | null;
  try {
    website = normalizeWebsite(String(formData.get("website") ?? ""));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Bitte die Website prüfen." };
  }

  try {
    await updateMeinHersteller(supabase, user.id, {
      company_name,
      contact_person: text("contact_person"),
      phone: text("phone"),
      website,
      street: text("street"),
      postal_code: text("postal_code"),
      city: text("city"),
      country: text("country"),
    });
  } catch {
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return { ok: true, error: null, website };
}
