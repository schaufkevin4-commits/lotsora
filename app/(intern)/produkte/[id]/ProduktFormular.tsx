// app/(intern)/produkte/[id]/ProduktFormular.tsx
"use client";

import { useActionState } from "react";
import { produktSpeichern, type ProduktFormState } from "./actions";
import type { Product } from "@/lib/services/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: ProduktFormState = { ok: false, error: null };

export function ProduktFormular({ produkt }: { produkt: Product }) {
  const [state, formAction, pending] = useActionState(
    produktSpeichern.bind(null, produkt.id),
    initial,
  );

  return (
    <form action={formAction} className="space-y-5">
      <section className="space-y-4 rounded-lg border p-5">
        <h2 className="font-medium">Basis</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Produktname *</Label>
          <Input id="name" name="name" defaultValue={produkt.name ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Produktbeschreibung *</Label>
          <Textarea id="description" name="description" defaultValue={produkt.description ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Produktkategorie *</Label>
          <Input id="category" name="category" defaultValue={produkt.category ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brand">Marke</Label>
          <Input id="brand" name="brand" defaultValue={produkt.brand ?? ""} />
        </div>
      </section>

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