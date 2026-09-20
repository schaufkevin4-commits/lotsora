import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

// Ausschließlich mit einem serverseitigen Admin-Client ausführen. Jeder Batch
// stammt aus dem bestätigten DB-Auftrag, nie aus vom Browser gesendeten Pfaden/IDs.
export async function runDeletionJob(admin: SupabaseClient<Database>, jobId: string) {
  for (let pass = 0; pass < 4; pass++) {
    const advanced = await admin.rpc("advance_deletion_job", { p_job_id: jobId });
    if (advanced.error) throw advanced.error;
    if (advanced.data) return { complete: true, failed: false };
    const batch = await admin.rpc("deletion_job_batch", { p_job_id: jobId });
    if (batch.error) throw batch.error;
    const { files, accounts } = batch.data as { files: string[]; accounts: string[] };
    if (files.length) {
      const removed = await admin.storage.from("produkt-dokumente").remove(files);
      if (removed.error) return { complete: false, failed: true };
    }
    for (const accountId of accounts) {
      const deleted = await admin.auth.admin.deleteUser(accountId);
      if (deleted.error && deleted.error.code !== "user_not_found" && deleted.error.status !== 404) {
        return { complete: false, failed: true };
      }
    }
  }
  const final = await admin.rpc("advance_deletion_job", { p_job_id: jobId });
  if (final.error) throw final.error;
  return { complete: final.data === true, failed: false };
}
