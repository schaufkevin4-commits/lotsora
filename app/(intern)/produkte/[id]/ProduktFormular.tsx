// app/(intern)/produkte/[id]/ProduktFormular.tsx
"use client";

import { useActionState, useState } from "react";
import { produktSpeichern, type ProduktFormState } from "./actions";
import { MaterialAbschnitt } from "./MaterialAbschnitt";
import { ProduktdetailsAbschnitt } from "./ProduktdetailsAbschnitt";
import { PflegeAbschnitt } from "./PflegeAbschnitt";
import { KreislaufAbschnitt } from "./KreislaufAbschnitt";
import type {
  Product,
  Material,
  Textildaten,
  Nachhaltigkeit,
} from "@/lib/services/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: ProduktFormState = { ok: false, error: null };

// Markierung für leere Pflichtfelder: roter Rahmen + roter Fokus-Ring.
const FEHLT_KLASSE = "border-destructive focus-visible:ring-destructive/30";

export function ProduktFormular({
  produkt,
  materialien,
  textildaten,
  nachhaltigkeit,
}: {
  produkt: Product;
  materialien: Material[];
  textildaten: Textildaten | null;
  nachhaltigkeit: Nachhaltigkeit | null;
}) {
  const [state, formAction, pending] = useActionState(
    produktSpeichern.bind(null, produkt.id),
    initial,
  );

  // Pflichtfelder (PP-010) kontrolliert halten, damit wir live sehen, was fehlt.
  // Kein natives `required` → Entwurf bleibt trotz Lücke speicherbar (PP-011).
  const [name, setName] = useState(produkt.name ?? "");
  const [description, setDescription] = useState(produkt.description ?? "");
  const [category, setCategory] = useState(produkt.category ?? "");

  const fehltName = name.trim() === "";
  const fehltDescription = description.trim() === "";
  const fehltCategory = category.trim() === "";

  return (
    <form action={formAction} className="space-y-5">
      <section className="space-y-4 rounded-lg border p-5">
        <h2 className="font-medium">Basis</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Produktname *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={fehltName || undefined}
            className={fehltName ? FEHLT_KLASSE : undefined}
          />
          {fehltName && (
            <p className="text-sm text-destructive">Pflichtfeld – bitte ausfüllen.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Produktbeschreibung *</Label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={fehltDescription || undefined}
            className={fehltDescription ? FEHLT_KLASSE : undefined}
          />
          {fehltDescription && (
            <p className="text-sm text-destructive">Pflichtfeld – bitte ausfüllen.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Produktkategorie *</Label>
          <Input
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-invalid={fehltCategory || undefined}
            className={fehltCategory ? FEHLT_KLASSE : undefined}
          />
          {fehltCategory && (
            <p className="text-sm text-destructive">Pflichtfeld – bitte ausfüllen.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brand">Marke</Label>
          <Input id="brand" name="brand" defaultValue={produkt.brand ?? ""} />
        </div>
      </section>

      <MaterialAbschnitt materialien={materialien} />

      <ProduktdetailsAbschnitt textildaten={textildaten} />

      <PflegeAbschnitt textildaten={textildaten} />

      <KreislaufAbschnitt nachhaltigkeit={nachhaltigkeit} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.ok && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription className="text-green-800">Gespeichert.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}