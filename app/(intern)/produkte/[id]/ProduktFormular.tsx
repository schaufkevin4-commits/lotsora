// app/(intern)/produkte/[id]/ProduktFormular.tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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

// Autosave: so lange nach der letzten Änderung warten, bevor gesichert wird.
const AUTOSAVE_MS = 1200;

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

  // --- Autosave (PP-019 E2): Knopf PLUS automatisches Sichern nach Tipp-Pause,
  //     beides über dieselbe Server Action `produktSpeichern`. ----------------
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gespeicherterStand = useRef<string | null>(null); // was zuletzt gesichert wurde
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const [ungespeichert, setUngespeichert] = useState(false);

  // Momentaufnahme des Formularinhalts – für „hat sich wirklich etwas geändert?".
  function standJetzt(): string {
    if (!formRef.current) return "";
    const fd = new FormData(formRef.current);
    return [...fd.entries()].map(([k, v]) => `${k}=${String(v)}`).join("&");
  }

  function sichereWennNoetig() {
    if (pendingRef.current) return; // läuft schon; der pending-Effekt plant neu
    if (standJetzt() === gespeicherterStand.current) return; // nichts Neues
    formRef.current?.requestSubmit();
  }

  // Ausgangsstand beim Laden merken – gilt als „bereits gespeichert".
  useEffect(() => {
    gespeicherterStand.current = standJetzt();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wurde während eines Speicherns getippt, nach dem Ende erneut prüfen.
  useEffect(() => {
    if (!pending) sichereWennNoetig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Erfolgreiches Speichern ⇒ Anzeige „sauber", wenn seither nichts Neues kam.
  useEffect(() => {
    if (state.ok && standJetzt() === gespeicherterStand.current) {
      setUngespeichert(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Nach jeder Änderung eine Sicherung planen (entprellt).
  function planeAutosave() {
    setUngespeichert(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(sichereWennNoetig, AUTOSAVE_MS);
  }

  // Beim Absenden (Knopf ODER Autosave) den gesicherten Stand festhalten.
  function beimAbsenden() {
    gespeicherterStand.current = standJetzt();
  }

  const statusText = pending
    ? "Speichert …"
    : state.error
      ? "Nicht gespeichert"
      : ungespeichert
        ? "Nicht gespeicherte Änderungen"
        : state.ok
          ? "Automatisch gespeichert"
          : "";

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={planeAutosave}
      onSubmit={beimAbsenden}
      className="space-y-5"
    >
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

      <div className="flex items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {statusText}
        </span>
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}