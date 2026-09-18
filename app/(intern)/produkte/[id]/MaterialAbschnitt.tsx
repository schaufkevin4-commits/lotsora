// app/(intern)/produkte/[id]/MaterialAbschnitt.tsx
"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
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

export function MaterialAbschnitt({ materialien, onStructureChange }: { materialien: Material[]; onStructureChange: () => void }) {
  const [structure, setStructure] = useState(0);
  const prefix = useId();
  const focusId = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (structure > 0) onStructureChange();
    if (focusId.current) {
      document.getElementById(focusId.current)?.focus();
      focusId.current = null;
    }
  }, [structure, onStructureChange]);
  const [zeilen, setZeilen] = useState<Zeile[]>(() => startZeilen(materialien));
  const naechsteId = useRef(0); // fortlaufende IDs für neu hinzugefügte Zeilen

  const setName = (id: string, v: string) =>
    setZeilen((z) => z.map((r) => (r.id === id ? { ...r, name: v } : r)));
  const setPct = (id: string, v: string) =>
    setZeilen((z) => z.map((r) => (r.id === id ? { ...r, pct: v } : r)));
  const hinzufuegen = () => {
    const id = `neu-${naechsteId.current++}`;
    focusId.current = `${prefix}-name-${id}`;
    setZeilen((z) => [...z, { id, name: "", pct: "" }]);
    setStructure((n) => n + 1);
  };
  const entfernen = (id: string) => {
    const index = zeilen.findIndex(r => r.id === id);
    const next = zeilen[index + 1] ?? zeilen[index - 1];
    focusId.current = next ? `${prefix}-name-${next.id}` : `${prefix}-add`;
    setZeilen(z => z.filter(r => r.id !== id));
    setStructure(n => n + 1);
  };

  // Live-Summe (PP-012). Nur Zeilen mit Namen zählen — genau wie beim Speichern.
  const check = checkMaterialShares(
    zeilen
      .filter((r) => r.name.trim().length > 0)
      .map((r) => ({ materialName: r.name, percentage: zuProzent(r.pct) })),
  );

  const summeKlasse = check.isOverLimit
    ? "text-sm font-medium text-destructive"
    : check.isUnderLimit
      ? "text-sm text-amber-800 dark:text-amber-300"
      : "text-sm text-muted-foreground";

  return (
    <details open className="space-y-4 rounded-lg border p-5">
      <summary className="cursor-pointer font-medium">Material</summary>
      <div>
        <p className="text-sm text-muted-foreground">
          Faserzusammensetzung – z. B. Baumwolle 80 %, Polyester 20 %.
        </p>
      </div>

      <div className="space-y-3">
        {zeilen.map((r) => (
          <div key={r.id} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${prefix}-name-${r.id}`}>Material</Label>
              <Input
                id={`${prefix}-name-${r.id}`}
                name="material_name"
                value={r.name}
                onChange={(e) => setName(r.id, e.target.value)}
                placeholder="z. B. Baumwolle"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${prefix}-pct-${r.id}`}>Anteil %</Label>
              <Input
                id={`${prefix}-pct-${r.id}`}
                aria-describedby={`${prefix}-sum`}
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
              aria-label={`Material ${r.name || "ohne Namen"} entfernen`}
            >
              Entfernen
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button id={`${prefix}-add`} type="button" variant="outline" onClick={hinzufuegen}>
          + Material hinzufügen
        </Button>
        <p id={`${prefix}-sum`} className={summeKlasse} aria-live="polite">
          Summe: {check.sum}%
          {check.isOverLimit
            ? " – mehr als 100 % ist nicht möglich"
            : check.isUnderLimit
              ? " – Hinweis: unter 100 %"
              : ""}
        </p>
      </div>
    </details>
  );
}
