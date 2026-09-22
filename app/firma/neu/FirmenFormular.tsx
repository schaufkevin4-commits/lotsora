"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firmaAnlegen, type CompanyCreationState } from "./actions";

export function FirmenFormular({ requestId }: { requestId: string }) {
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState<CompanyCreationState, FormData>(firmaAnlegen, {});
  return <form action={action} className="space-y-5">
    <input type="hidden" name="request_id" value={requestId} />
    <div className="space-y-2">
      <Label htmlFor="company-name">Firmenname *</Label>
      <Input id="company-name" name="company_name" value={name} onChange={event => setName(event.target.value)}
        required maxLength={200} autoComplete="organization" disabled={pending}
        aria-describedby="company-help" />
      <p id="company-help" className="text-sm text-muted-foreground">Weitere Firmenangaben kannst du anschließend im Profil ergänzen.</p>
    </div>
    <p className="text-sm">Es entsteht ein neuer, leerer Firmenbereich. Frühere Firmendaten und gelöschte Produktpässe werden nicht wiederhergestellt. Du wirst der Firmenverantwortliche.</p>
    {state.error && <div role="alert" className="space-y-2 rounded-md border border-destructive p-3">
      <p>{state.error}</p>
      {state.next === "company" && <Link className="underline" href="/dashboard">Bestehende Firma öffnen</Link>}
      {state.next === "account" && <Link className="underline" href="/konto">Löschvorgang verwalten</Link>}
      {state.next === "reload" && <Button type="button" variant="outline" onClick={() => window.location.reload()}>Seite neu laden</Button>}
    </div>}
    <div className="flex flex-wrap items-center gap-4">
      <Button type="submit" disabled={pending || !!state.next}>{pending ? "Firma wird angelegt …" : "Neuen Firmenbereich anlegen"}</Button>
      <Link href="/dashboard" className="text-sm underline">Zurück zur Auswahl</Link>
    </div>
    <p role="status" className="sr-only">{pending ? "Die Firmenanlage wird geprüft." : ""}</p>
  </form>;
}
