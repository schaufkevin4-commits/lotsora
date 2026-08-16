// app/(auth)/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };
export type ResetState = { error: string | null; sent: boolean };

// Supabase-Fehler in eine verständliche, nicht-technische Meldung übersetzen.
function freundlich(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Für diese E-Mail gibt es bereits ein Konto. Bitte anmelden.";
  }
  if (message.includes("Password should be at least")) {
    return "Das Passwort ist zu kurz (mindestens 6 Zeichen).";
  }
  return "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
}

export async function registrieren(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();

  if (!companyName) return { error: "Bitte einen Firmennamen angeben." };
  if (!email) return { error: "Bitte eine E-Mail-Adresse angeben." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_name: companyName }, // -> raw_user_meta_data -> Trigger aus Schritt 3
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) return { error: freundlich(error.message) };
  redirect("/registriert");
}

export async function anmelden(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: freundlich(error.message) };
  redirect("/dashboard");
}

export async function abmelden(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function passwortResetAnfordern(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Bitte eine E-Mail-Adresse angeben.", sent: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/passwort-neu`,
  });

  if (error) return { error: freundlich(error.message), sent: false };
  return { error: null, sent: true };
}

export async function passwortNeuSetzen(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "Das Passwort ist zu kurz (mindestens 6 Zeichen)." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: freundlich(error.message) };
  redirect("/dashboard");
}