"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { continueDeletion, createDeletionAdmin, getDeletionPreview, verifyDeletionPassword } from "@/lib/services/account-deletion";

export type DeletionState = { error?: string; jobId?: string; complete?: boolean; deleteSelf?: boolean; companyDeleted?: boolean; failed?: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function choice(value: FormDataEntryValue | null) {
  if (value !== "yes" && value !== "no") throw new Error("Bitte für Mitarbeiterkonten und eigenes Konto jeweils eine Auswahl treffen.");
  return value === "yes";
}
export async function deletionAction(_previous: DeletionState, form: FormData): Promise<DeletionState> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user?.email) return { error: "Bitte erneut anmelden. Falls dein Konto bereits gelöscht wurde, ist keine Anmeldung mehr möglich." };
  let jobId: string;
  let deleteSelf = false;
  let companyDeleted = false;
  let outcome: DeletionState;
  try {
    const intent = form.get("intent");
    const admin = createDeletionAdmin();
    if (intent === "continue") {
      jobId = String(form.get("job_id") ?? "");
      if (!uuid.test(jobId)) throw new Error("Ungültiger Löschauftrag.");
      // Nutzer-RLS, bevor der Admin irgendeinen Auftrag fortsetzt.
      const job = await client.from("deletion_jobs").select("id,delete_self,state,company_id").eq("id", jobId).single();
      if (job.error) throw new Error("Löschauftrag nicht gefunden oder kein Zugriff.");
      deleteSelf = job.data.delete_self;
      companyDeleted = job.data.company_id !== null;
    } else {
      if (intent !== "company" && intent !== "account") throw new Error("Unbekannte Aktion.");
      if (form.get("understood") !== "yes") throw new Error("Bitte Datensicherung und endgültige Folgen bestätigen.");
      await verifyDeletionPassword(user.id, user.email, String(form.get("password") ?? ""));
      if (intent === "company") {
        const companyId = String(form.get("company_id") ?? "");
        if (!uuid.test(companyId)) throw new Error("Ungültige Firma.");
        const deleteMembers = choice(form.get("delete_members"));
        deleteSelf = choice(form.get("delete_self"));
        const preview = await getDeletionPreview(client, companyId);
        if (String(form.get("company_name") ?? "") !== preview.companyName) throw new Error("Bitte den Firmennamen exakt zur Bestätigung eingeben.");
        const result = await admin.rpc("start_company_deletion", {
          p_actor_id: user.id, p_company_id: companyId, p_fingerprint: String(form.get("fingerprint") ?? ""),
          p_delete_members: deleteMembers, p_delete_self: deleteSelf,
        });
        if (result.error) {
          if (result.error.code === "40001") throw new Error("Firma, Team oder Daten wurden geändert. Bitte die Seite neu laden und die aktuelle Übersicht bestätigen.");
          throw new Error("Firmenlöschung konnte nicht gestartet werden. Bitte die aktuelle Übersicht prüfen und erneut versuchen.");
        }
        jobId = result.data;
        companyDeleted = true;
      } else {
        if (form.get("confirmation") !== "KONTO LÖSCHEN") throw new Error("Bitte KONTO LÖSCHEN zur Bestätigung eingeben.");
        const result = await admin.rpc("start_account_deletion", { p_actor_id: user.id });
        if (result.error) throw new Error("Konto kann noch nicht gelöscht werden. Bitte zuerst die Firmenverantwortung übertragen und offene Löschvorgänge abschließen.");
        jobId = result.data;
        deleteSelf = true;
      }
    }
    // Der Auftrag ist bereits dauerhaft gespeichert, auch wenn ein HTTP-Aufruf abbricht.
    const progress = await continueDeletion(admin, jobId);
    if (progress.complete && deleteSelf) await client.auth.signOut({ scope: "local" });
    revalidatePath("/konto");
    revalidatePath("/profil");
    outcome = { jobId, deleteSelf, companyDeleted, ...progress };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Löschung konnte nicht gestartet werden. Bitte erneut versuchen." };
  }
  if (outcome.complete && outcome.deleteSelf) redirect("/konto-geloescht");
  return outcome;
}
