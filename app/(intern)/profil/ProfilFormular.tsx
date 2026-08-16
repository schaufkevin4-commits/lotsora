// app/(intern)/profil/ProfilFormular.tsx
"use client";

import { useActionState } from "react";
import { profilSpeichern, type ProfilState } from "./actions";
import type { Manufacturer } from "@/lib/services/manufacturers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: ProfilState = { ok: false, error: null };

function Feld({ id, label, value, type = "text" }: {
  id: string; label: string; value: string | null; type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} defaultValue={value ?? ""} />
    </div>
  );
}

export function ProfilFormular({ hersteller }: { hersteller: Manufacturer | null }) {
  const [state, formAction, pending] = useActionState(profilSpeichern, initial);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Feld id="company_name" label="Firmenname *" value={hersteller?.company_name ?? ""} />
      <Feld id="contact_person" label="Ansprechpartner" value={hersteller?.contact_person ?? null} />
      <Feld id="phone" label="Telefon" value={hersteller?.phone ?? null} />
      <Feld id="website" label="Website" value={hersteller?.website ?? null} />
      <Feld id="street" label="Straße" value={hersteller?.street ?? null} />
      <div className="grid grid-cols-2 gap-4">
        <Feld id="postal_code" label="PLZ" value={hersteller?.postal_code ?? null} />
        <Feld id="city" label="Ort" value={hersteller?.city ?? null} />
      </div>
      <Feld id="country" label="Land" value={hersteller?.country ?? null} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.ok && (
        <Alert>
          <AlertDescription>Gespeichert.</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}