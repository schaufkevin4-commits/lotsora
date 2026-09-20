"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamAktion, type TeamState } from "./actions";

function Ergebnis({ state }: { state: TeamState }) {
  return <>
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.message && <p role="status" className="text-sm">{state.message}</p>}
  </>;
}

export function EinladenFormular() {
  const [state, action, pending] = useActionState(teamAktion, {});
  return <form action={action} className="space-y-4">
    <input type="hidden" name="intent" value="invite" />
    <div className="space-y-2">
      <Label htmlFor="team-email">E-Mail-Adresse</Label>
      <Input id="team-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@firma.de" />
    </div>
    <Button disabled={pending} type="submit">{pending ? "Wird erstellt …" : "Einladungslink erstellen"}</Button>
    <Ergebnis state={state} />
    {state.invitationUrl && <div className="space-y-2 rounded-md bg-muted p-3">
      <Label htmlFor="team-link">Persönlicher Einladungslink · 7 Tage gültig</Label>
      <Input id="team-link" readOnly value={state.invitationUrl} onFocus={event => event.target.select()} />
      <p className="text-xs text-muted-foreground">Link markieren und kopieren. Er funktioniert nur mit der bestätigten E-Mail-Adresse dieser Person. Bei einer neuen Einladung wird ihr bisheriger Link ungültig.</p>
    </div>}
  </form>;
}

export function TeamAenderung({ id, intent, label, explanation }: {
  id: string; intent: "remove" | "transfer" | "revoke"; label: string; explanation: string;
}) {
  const [state, action, pending] = useActionState(teamAktion, {});
  return <details className="text-sm">
    <summary className="cursor-pointer py-1 underline underline-offset-4">{label}</summary>
    <form action={action} className="mt-2 space-y-3 rounded-md border p-3">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="id" value={id} />
      <p>{explanation}</p>
      <label className="flex items-center gap-2"><input type="checkbox" name="confirmed" value="yes" required />Änderung bestätigen</label>
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Wird gespeichert …" : label}</Button>
      <Ergebnis state={state} />
    </form>
  </details>;
}
