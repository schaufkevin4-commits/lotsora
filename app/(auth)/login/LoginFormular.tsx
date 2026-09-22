"use client";

import { Zugangsseite } from "@/components/layout/zugangsseite";

import { useActionState } from "react";
import Link from "next/link";
import { anmelden, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: AuthState = { error: null };

export function LoginFormular({ bestaetigungFehlgeschlagen }: { bestaetigungFehlgeschlagen: boolean }) {
  const [state, formAction, pending] = useActionState(anmelden, initial);

  return (
    <Zugangsseite titel="Anmelden">

      {bestaetigungFehlgeschlagen && <Alert variant="destructive"><AlertDescription>Der Bestätigungslink ist ungültig, abgelaufen oder wurde bereits verwendet. Für ein neues Passwort fordere bitte einen neuen Link über „Passwort vergessen?“ an.</AlertDescription></Alert>}
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Wird angemeldet …" : "Anmelden"}
        </Button>
      </form>
      <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
        <Link href="/passwort-vergessen" className="underline">Passwort vergessen?</Link>
        <Link href="/registrieren" className="underline">Neu hier? Konto erstellen</Link>
      </div>
    </Zugangsseite>
  );
}
