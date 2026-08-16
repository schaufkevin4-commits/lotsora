"use client";

import { useActionState } from "react";
import { passwortNeuSetzen, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: AuthState = { error: null };

export default function PasswortNeuPage() {
  const [state, formAction, pending] = useActionState(passwortNeuSetzen, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Neues Passwort</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Neues Passwort</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
        </div>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : "Passwort speichern"}
        </Button>
      </form>
    </main>
  );
}