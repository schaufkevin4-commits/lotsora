"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { einladungAktion } from "./actions";

export function EinladungFormular({ token, signedIn }: { token: string; signedIn: boolean }) {
  const [state, action, pending] = useActionState(einladungAktion.bind(null, token), {});
  return <form action={action} className="space-y-4">
    {signedIn ? <Button name="intent" value="accept" disabled={pending}>Einladung annehmen</Button> : <>
      <div className="space-y-2"><Label htmlFor="invite-email">Eingeladene E-Mail-Adresse</Label><Input type="email" id="invite-email" name="email" autoComplete="email" required maxLength={254} /></div>
      <div className="space-y-2"><Label htmlFor="invite-password">Passwort</Label><Input type="password" id="invite-password" name="password" autoComplete="current-password" minLength={6} required /></div>
      <div className="flex flex-wrap gap-2"><Button name="intent" value="login" disabled={pending}>Anmelden</Button><Button variant="outline" name="intent" value="signup" disabled={pending}>Neues Teamkonto erstellen</Button></div>
      <p className="text-xs text-muted-foreground">Für ein neues Teamkonto ein eigenes Passwort wählen. Es wird keine separate Firma angelegt.</p>
    </>}
    {pending && <p role="status" className="text-sm">Wird bearbeitet …</p>}
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.message && <p role="status" className="text-sm">{state.message}</p>}
  </form>;
}
