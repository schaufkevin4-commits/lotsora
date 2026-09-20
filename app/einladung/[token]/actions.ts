"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EinladungState = { error?: string; message?: string };

export async function einladungAktion(token: string, _prev: EinladungState, form: FormData): Promise<EinladungState> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { error: "Einladung ungültig." };
  const supabase = await createClient();
  const intent = form.get("intent");
  if (intent === "accept") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Bitte zuerst anmelden." };
    const { error } = await supabase.rpc("accept_company_invitation", { p_token: token });
    if (error) return { error: ["22023", "23514", "42501"].includes(error.code) ? error.message : "Beitritt fehlgeschlagen. Bitte erneut versuchen." };
    revalidatePath("/", "layout");
    redirect("/team");
  }
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || password.length < 6) return { error: "Bitte E-Mail und Passwort mit mindestens 6 Zeichen angeben." };
  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password, options: {
      data: { join_team: true },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/einladung/${token}`,
    } });
    if (error) return { error: "Registrierung fehlgeschlagen. Falls du bereits ein Konto hast, melde dich bitte an." };
    if (!data.session) return { message: "Prüfe dein E-Mail-Postfach und bestätige deine Adresse. Öffne danach diesen Einladungslink erneut und melde dich an." };
  } else if (intent === "login") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Anmelden fehlgeschlagen. Prüfe E-Mail, Passwort und E-Mail-Bestätigung." };
  } else return { error: "Unbekannte Aktion." };
  redirect(`/einladung/${token}`);
}
