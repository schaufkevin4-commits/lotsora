import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { getEditorStand } from "@/lib/services/products";

type DB = SupabaseClient<Database>;
type SaveArgs = Database["public"]["Functions"]["save_product_checked"]["Args"];

// Nur Testaufbau/-fortsetzung: bewusst einen neuen Formularstand lesen.
// Konflikttests behalten ihre alten Argumente; dieser Helfer wiederholt niemals.
export async function fixtureSaveArgs(client: DB, id: string): Promise<SaveArgs> {
  const snapshot = await getEditorStand(client, id);
  if (!snapshot) throw new Error("Testprodukt nicht sichtbar.");
  const { produkt: p, materialien, textildaten, nachhaltigkeit } = snapshot;
  return {
    p_product_id: p.id, p_expected_version: p.editor_version, p_expected_status: p.status,
    p_name: p.name, p_description: p.description, p_category: p.category,
    p_brand: p.brand ?? "", p_article_number: p.article_number ?? "",
    p_materials: materialien.map(m => ({ material_name: m.material_name, percentage: m.percentage })),
    p_textile_data: textildaten ?? {}, p_sustainability: nachhaltigkeit ?? {},
  };
}
export async function saveFixtureProduct(client: DB, id: string, changes: Partial<SaveArgs>) {
  return client.rpc("save_product_checked", { ...await fixtureSaveArgs(client, id), ...changes });
}
export async function publishFixtureProduct(client: DB, id: string, publish: boolean) {
  const { data, error } = await client.from("products").select("editor_version").eq("id", id).single();
  if (error) throw error;
  return client.rpc("set_product_publication_checked", { p_product_id: id, p_expected_version: data.editor_version, p_publish: publish });
}
