// app/(intern)/profil/ProfilFormular.tsx
"use client";

import { useActionState, useState } from "react";
import { profilSpeichern, type ProfilState } from "./actions";
import type { Manufacturer } from "@/lib/services/manufacturers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: ProfilState = { ok: false, error: null };

function Feld({ id, label, value, onChange, type = "text", required = false, autoComplete, placeholder }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  type?: string; required?: boolean; autoComplete?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} value={value} onChange={event => onChange(event.target.value)}
        required={required} autoComplete={autoComplete} placeholder={placeholder} />
    </div>
  );
}

export function ProfilFormular({ hersteller, countries }: {
  hersteller: Manufacturer | null;
  countries: { code: string; name: string }[];
}) {
  const [values, setValues] = useState({
    company_name: hersteller?.company_name ?? "", country: hersteller?.country ?? "",
    website: hersteller?.website ?? "", contact_person: hersteller?.contact_person ?? "",
    phone: hersteller?.phone ?? "", street: hersteller?.street ?? "",
    postal_code: hersteller?.postal_code ?? "", city: hersteller?.city ?? "",
  });
  const [state, formAction, pending] = useActionState(async (previous: ProfilState, data: FormData) => {
    const result = await profilSpeichern(previous, data);
    if (result.ok) setValues(current => ({ ...current, website: result.website ?? "" }));
    return result;
  }, initial);
  const field = (key: keyof typeof values) => ({
    id: key, value: values[key],
    onChange: (value: string) => setValues(current => ({ ...current, [key]: value })),
  });
  const legacyCountry = values.country && !countries.some(country => country.code === values.country);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Dieses Firmenprofil gilt für euer gesamtes Team. Mit * markierte Angaben sind Pflichtfelder.
      </p>
      <fieldset disabled={pending} aria-describedby="public-profile-help" className="min-w-0 space-y-4 rounded-lg border p-5">
        <legend className="px-1 font-semibold">Öffentliches Firmenprofil</legend>
        <p id="public-profile-help" className="text-sm text-muted-foreground">Änderungen werden erst öffentlich, wenn ihr beim jeweiligen Produkt „Veröffentlichung aktualisieren“ auswählt oder es erstmals veröffentlicht.</p>
        <Feld {...field("company_name")} label="Firmenname *" required autoComplete="organization" />
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Land des Firmensitzes (optional)</Label>
          <select id="country" name="country" value={values.country} autoComplete="country"
            onChange={event => field("country").onChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
            <option value="">Bitte wählen</option>
            {legacyCountry && <option value={values.country}>{values.country} (bisherige Angabe)</option>}
            {countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
        </div>
        <Feld {...field("website")} label="Website (optional)" autoComplete="url" placeholder="www.firma.de" />
      </fieldset>
      <details className="rounded-lg border p-5">
        <summary className="cursor-pointer font-semibold">Interne Kontaktdaten · optional</summary>
      <fieldset disabled={pending} aria-describedby="internal-profile-help" className="mt-4 min-w-0 space-y-4">
        <legend className="sr-only">Interne Kontaktdaten</legend>
        <p id="internal-profile-help" className="text-sm text-muted-foreground">Diese Angaben sind optional und nicht im öffentlichen Produktpass sichtbar.</p>
        <Feld {...field("contact_person")} label="Interner Ansprechpartner" />
        <Feld {...field("phone")} label="Telefon" type="tel" autoComplete="tel" />
        <Feld {...field("street")} label="Straße und Hausnummer" autoComplete="street-address" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Feld {...field("postal_code")} label="PLZ" autoComplete="postal-code" />
          <Feld {...field("city")} label="Ort" autoComplete="address-level2" />
        </div>
      </fieldset>
      </details>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.ok && (
        <Alert role="status">
          <AlertDescription>Gespeichert.</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}
