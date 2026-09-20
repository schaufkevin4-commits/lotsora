"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, SiteUrlFehler } from "@/lib/site-url";

export type TeamState = { error?: string; message?: string; invitationUrl?: string };

export async function teamAktion(_previous: TeamState, form: FormData): Promise<TeamState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte erneut anmelden." };
  const intent = String(form.get("intent") ?? "");
  if (intent === "invite") {
    let siteUrl: string;
    try { siteUrl = getSiteUrl(); }
    catch (error) {
      if (error instanceof SiteUrlFehler) return { error: error.message };
      throw error;
    }
    const { data, error } = await supabase.rpc("create_company_invitation", {
      p_email: String(form.get("email") ?? "").trim(),
    });
    if (error) return { error: error.code === "22023" ? error.message : "Einladen fehlgeschlagen. Nur Firmenverantwortliche können das Team verwalten." };
    const invitation = data[0];
    if (!invitation) return { error: "Einladung konnte nicht erstellt werden." };
    revalidatePath("/team");
    return {
      message: "Einladung erstellt. Teile diesen Link mit der eingeladenen Person. Es wurde keine E-Mail verschickt.",
      invitationUrl: `${siteUrl}/einladung/${invitation.token}`,
    };
  }
  if (form.get("confirmed") !== "yes") return { error: "Bitte die Änderung bestätigen." };
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Ungültiger Eintrag." };
  const result = intent === "revoke"
    ? await supabase.rpc("revoke_company_invitation", { p_invitation_id: id })
    : intent === "remove"
      ? await supabase.rpc("remove_company_member", { p_user_id: id })
      : intent === "transfer"
        ? await supabase.rpc("transfer_company_ownership", { p_user_id: id })
        : null;
  if (!result) return { error: "Unbekannte Aktion." };
  if (result.error) return { error: "Änderung nicht möglich. Lade die Seite neu und prüfe deine Teamrechte." };
  revalidatePath("/", "layout");
  return { message: intent === "remove" ? "Teammitglied entfernt. Seine Firmendaten bleiben erhalten." : intent === "transfer" ? "Firmenverantwortung übergeben. Du bist jetzt Mitarbeiter." : "Einladung widerrufen." };
}
