import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Separater Client ausschließlich für die Bestätigung geprüfter Dateiinhalte.
// Kein Nutzer-Cookie und niemals an Browser/öffentliche Leser weitergeben.
export function createFileVerifier() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Serverkonfiguration für Dateiüberprüfung fehlt.");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
