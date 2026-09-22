import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { CompanyEntryState } from "@/lib/company-entry";

export async function getCompanyEntryState(client: SupabaseClient<Database>): Promise<CompanyEntryState> {
  const { data, error } = await client.rpc("get_company_entry_state");
  if (error || !["ready", "member", "deleting", "unconfirmed"].includes(data ?? "")) {
    throw new Error("Firmenzugang konnte nicht geprüft werden. Bitte lade die Seite erneut.");
  }
  return data as CompanyEntryState;
}

export async function createOwnCompany(client: SupabaseClient<Database>, name: string, requestId: string) {
  return client.rpc("create_own_company", { p_name: name, p_request_id: requestId });
}
