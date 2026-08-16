"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrieren, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: AuthState = { error: null };

export default function RegistrierenPage() {
  const [state, formAction, pending] = useActionState(registrieren, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Konto erstellen</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company_name">Firmenname</Label>
          <Input id="company_name" name="company_name" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
        </div>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Wird erstellt …" : "Konto erstellen"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Konto vorhanden? <Link href="/login" className="underline">Anmelden</Link>
      </p>
    </main>
  );
}