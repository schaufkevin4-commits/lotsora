import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { runDeletionJob } from "./deletion-runner";

type DB = SupabaseClient<Database>;
export type DeletionPreview = {
  companyId: string; companyName: string; ownerId: string; fingerprint: string;
  members: { id: string; email: string; owner: boolean }[];
  products: number; published: number; files: number; documents: number;
};
export function createDeletionAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Löschung ist derzeit nicht verfügbar. Bitte später erneut versuchen.");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export async function getDeletionPreview(client: DB, companyId: string) {
  const result = await client.rpc("company_deletion_preview", { p_company_id: companyId });
  if (result.error) throw result.error;
  return result.data as unknown as DeletionPreview;
}
export async function verifyDeletionPassword(userId: string, email: string, password: string) {
  if (!password || password.length > 1024) throw new Error("Bitte dein aktuelles Passwort eingeben.");
  // Kein Cookiewechsel und keine Anmeldung mit vom Formular gelieferter E-Mail.
  const check = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const signed = await check.auth.signInWithPassword({ email, password });
  const valid = !signed.error && signed.data.user?.id === userId;
  if (signed.data.session) await check.auth.signOut({ scope: "local" });
  if (!valid) throw new Error("Passwortbestätigung fehlgeschlagen. Bitte erneut versuchen.");
}
export async function continueDeletion(admin: DB, jobId: string) {
  try { return await runDeletionJob(admin, jobId); }
  catch { return { complete: false, failed: true }; }
}
