import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { getMissingRequiredFields, checkMaterialShares, type ProductDraft, type Material, type Textildaten, type Nachhaltigkeit } from "./products";

// Interne Orientierung anhand benannter Datengruppen, keine Compliance-Bewertung.
// Optionale Lücken ändern weder Produktstatus noch Veröffentlichungsbedingungen.
export function datenluecken(product: ProductDraft, materials: Material[], textile: Textildaten | null, sustainability: Nachhaltigkeit | null) {
  const required = getMissingRequiredFields(product);
  const optional: string[] = [];
  if (checkMaterialShares(materials.map((m) => ({ materialName: m.material_name, percentage: Number(m.percentage) }))).sum !== 100) optional.push("Materialzusammensetzung mit 100 %");
  if (!textile?.origin_country?.trim()) optional.push("Herkunftsland");
  if (!textile?.care_instructions?.trim() && !textile?.wash_instructions?.trim()) optional.push("Pflegehinweise");
  if (![sustainability?.recycling_notes, sustainability?.repair_notes, sustainability?.disposal_notes].some((v) => v?.trim())) optional.push("Hinweise zu Nutzung & Kreislauf");
  return { required, optional, label: required.length ? "unvollständig" : optional.length ? "teilweise vollständig" : "vollständig" };
}

export async function getDatenluecken(supabase: SupabaseClient<Database>, products: (ProductDraft & { id: string })[]) {
  if (!products.length) return [];
  const ids = products.map((p) => p.id);
  const [materials, textile, sustainability] = await Promise.all([
    supabase.from("product_materials").select("*").in("product_id", ids),
    supabase.from("product_textile_data").select("*").in("product_id", ids),
    supabase.from("product_sustainability").select("*").in("product_id", ids),
  ]);
  for (const result of [materials, textile, sustainability]) if (result.error) throw result.error;
  return products.map((p) => ({ id: p.id, name: p.name, ...datenluecken(p,
    materials.data!.filter((m) => m.product_id === p.id),
    textile.data!.find((t) => t.product_id === p.id) ?? null,
    sustainability.data!.find((s) => s.product_id === p.id) ?? null) }));
}
