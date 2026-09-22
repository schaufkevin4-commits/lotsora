"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createOwnCompany } from "@/lib/services/company-entry";
import { companyCreationError, validCompanyName } from "@/lib/company-entry";

export type CompanyCreationState = { error?: string; next?: "company" | "account" | "reload" };

export async function firmaAnlegen(_previous: CompanyCreationState, form: FormData): Promise<CompanyCreationState> {
  const name = String(form.get("company_name") ?? "").trim();
  const requestId = String(form.get("request_id") ?? "");
  if (!validCompanyName(name)) return companyCreationError("22023");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestId)) {
    return companyCreationError("P2203");
  }
  try {
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user?.email_confirmed_at) return companyCreationError("42501");
    const { data, error } = await createOwnCompany(client, name, requestId);
    if (error) return companyCreationError(error.code);
    if (!data) return companyCreationError();
  } catch {
    return companyCreationError();
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
