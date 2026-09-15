import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;
export type Dateivorgang = Database["public"]["Tables"]["file_operations"]["Row"];
export type LoeschErgebnis = { complete: boolean };
const BUCKET = "produkt-dokumente";

export async function getOffeneDateivorgaenge(supabase: DB, productId?: string): Promise<Dateivorgang[]> {
  // Aktive Uploads nicht als Fehler anzeigen. Nach 15 Minuten kann ein
  // abgebrochener Upload bewusst bereinigt werden; keine automatische Löschung.
  const stale = new Date(Date.now() - 15 * 60_000).toISOString();
  let query = supabase.from("file_operations").select("*")
    .or(`state.eq.cleanup,and(state.eq.uploading,created_at.lt.${stale})`)
    .order("created_at", { ascending: true });
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function bereinigeDatei(supabase: DB, operationId: string): Promise<LoeschErgebnis> {
  const { data: operation, error } = await supabase.rpc("begin_file_cleanup", { p_operation_id: operationId });
  if (error) throw error;
  if (operation.state === "deleted") return { complete: true };
  try {
    const result = await supabase.storage.from(BUCKET).remove([operation.file_path]);
    if (result.error) throw result.error;
    // Ein leeres remove-Ergebnis ist kein Beleg für eine entfernte Datei:
    // RLS kann sie verstecken. Die DB bestätigt die tatsächliche Abwesenheit.
    const finished = await supabase.rpc("finish_file_cleanup", { p_operation_id: operationId });
    if (finished.error) throw finished.error;
    return { complete: finished.data === true };
  } catch {
    // Auch ein DB-Ausfall beim Fehlervermerk verliert den dauerhaften Auftrag
    // nicht. Keine unbestätigte Löschung als abgeschlossen melden.
    try {
      await supabase.rpc("finish_file_cleanup", { p_operation_id: operationId, p_error_code: "cleanup_failed" });
    } catch { /* Auftrag bleibt offen. */ }
    return { complete: false };
  }
}

export async function bereinigeProduktdateien(supabase: DB, productId: string): Promise<LoeschErgebnis> {
  try {
    const { data, error } = await supabase.from("file_operations").select("id")
      .eq("product_id", productId).eq("state", "cleanup");
    if (error) throw error;
    let complete = true;
    for (const operation of data ?? []) {
      try { if (!(await bereinigeDatei(supabase, operation.id)).complete) complete = false; }
      catch { complete = false; }
    }
    // PostgREST begrenzt Ergebnislisten. Erst eine separate Restprüfung
    // bestätigt, dass auch außerhalb der bearbeiteten Seite nichts offen ist.
    const remaining = await supabase.from("file_operations").select("id", { count: "exact", head: true })
      .eq("product_id", productId).eq("state", "cleanup");
    return { complete: complete && !remaining.error && remaining.count === 0 };
  } catch { return { complete: false }; }
}
