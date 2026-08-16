// lib/services/manufacturers.ts
// Datenzugriffs-Service für Herstellerdaten (PP-021 E4).
// Bekommt den Supabase-Client übergeben; RLS (PP-017) sorgt dafür, dass nur die
// eigene Firmenzeile sichtbar/änderbar ist.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export type Manufacturer = Database["public"]["Tables"]["manufacturers"]["Row"];
export type ManufacturerUpdate = Database["public"]["Tables"]["manufacturers"]["Update"];

export async function getMeinHersteller(supabase: DB): Promise<Manufacturer | null> {
  const { data, error } = await supabase.from("manufacturers").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMeinHersteller(
  supabase: DB,
  userId: string,
  patch: ManufacturerUpdate,
): Promise<Manufacturer> {
  const { data, error } = await supabase
    .from("manufacturers")
    .update(patch)
    .eq("user_id", userId) // zusätzlich zur RLS explizit auf die eigene Zeile
    .select()
    .single();
  if (error) throw error;
  return data;
}