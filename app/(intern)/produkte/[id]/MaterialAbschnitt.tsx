// app/(intern)/produkte/[id]/MaterialAbschnitt.tsx
"use client";

import { useRef, useState } from "react";
import { checkMaterialShares, type Material } from "@/lib/services/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Eine Editor-Zeile. `id` ist nur ein stabiler React-Key (nicht in der DB),
// damit Zeilen beim Hinzufügen/Entfernen nicht durcheinandergeraten.
type Zeile = { id: string; name: string; pct: string };

// Startzeilen aus den gespeicherten Materialien.
// Leeres Produkt ⇒ eine leere Zeile, damit sofort etwas zum Ausfüllen da ist.
function startZeilen(materialien: Material[]): Zeile[] {
  if (materialien.length === 0) return [{ id: "m0", name: "", pct: "" }];
  return materialien.map((m, i) => ({
    id: `m${i}`,
    name: m.material_name,
    pct: m.percentage === null ? "" : String(m.percentage),
  }));
}

// "80" oder "80,5" ⇒ Zahl (für die Live-Summe).
function zuProzent(wert: string): number {
  const n = Number(wert.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function MaterialAbschnitt({ materialien }: { materialien: Material[] }) {
  const [zeilen, setZeilen] = useState<Zeile[]>(() => startZeilen(materialien));
  const naechsteId = useRef(0); // fortlaufende IDs für neu hinzugefügte Zeilen

  const setName = (id: string, v: string) =>
    setZeilen((z) => z.map((r) => (r.id === id ? { ...r, name: v } : r)));
  const setPct = (id: string, v: string) =>
    setZeilen((z) => z.map((r) => (r.id === id ? { ...r, pct: v } : r)));
  const hinzufuegen = () =>
    setZeilen((z) => [...z, { id: `neu-${naechsteId.current++}`, name: "", pct: "" }]);
  const entfernen = (id: string) => setZeilen((z) => z.filter((r) => r.id !== id));

  // Live-Summe (PP-012). Nur Zeilen mit Namen zählen — genau wie beim Speichern.
  const check = checkMaterialShares(
    zeilen
      .filter((r) => r.name.trim().length > 0)
      .map((r) => ({ materialName: r.name, percentage: zuProzent(r.pct) })),
  );

  const summeKlasse = check.isOverLimit
    ? "text-sm font-medium text-destructive"
    : check.isUnderLimit
      ? "text-sm text-amber-600"
      : "text-sm text-muted-foreground";

  return (
    <section className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="font-medium">Material</h2>
        <p className="text-sm text-muted-foreground">
          Faserzusammensetzung – z. B. Baumwolle 80 %, Polyester 20 %.
        </p>
      </div>

      <div className="space-y-3">
        {zeilen.map((r) => (
          <div key={r.id} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`name-${r.id}`}>Material</Label>
              <Input
                id={`name-${r.id}`}
                name="material_name"
                value={r.name}
                onChange={(e) => setName(r.id, e.target.value)}
                placeholder="z. B. Baumwolle"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor={`pct-${r.id}`}>Anteil %</Label>
              <Input
                id={`pct-${r.id}`}
                name="material_pct"
                type="number"
                min={0}
                max={100}
                step="0.01"
                inputMode="decimal"
                value={r.pct}
                onChange={(e) => setPct(r.id, e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => entfernen(r.id)}
              disabled={zeilen.length === 1}
            >
              Entfernen
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={hinzufuegen}>
          + Material hinzufügen
        </Button>
        <p className={summeKlasse}>
          Summe: {check.sum}%
          {check.isOverLimit
            ? " – mehr als 100 % ist nicht möglich"
            : check.isUnderLimit
              ? " – Hinweis: unter 100 %"
              : ""}
        </p>
      </div>
    </section>
  );
}