"use client";

import { useActionState } from "react";
import Link from "next/link";
import { passwortResetAnfordern, type ResetState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: ResetState = { error: null, sent: false };

export default function PasswortVergessenPage() {
  const [state, formAction, pending] = useActionState(passwortResetAnfordern, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Passwort zurücksetzen</h1>
      {state.sent ? (
        <p className="text-muted-foreground">
          Wenn ein Konto zu dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen
          geschickt. Bitte prüfe dein Postfach.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gesendet …" : "Link senden"}
          </Button>
        </form>
      )}
      <Link href="/login" className="text-sm underline">Zurück zur Anmeldung</Link>
    </main>
  );
}