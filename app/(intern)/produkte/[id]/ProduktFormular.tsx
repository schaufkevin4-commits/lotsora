// app/(intern)/produkte/[id]/ProduktFormular.tsx
"use client";

import { startTransition, useLayoutEffect, useRef, useState } from "react";
import { useEditor } from "./EditorProvider";
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
import Link from "next/link";


// Markierung für leere Pflichtfelder: roter Rahmen + roter Fokus-Ring.
const FEHLT_KLASSE = "border-destructive focus-visible:ring-destructive/30";


export function ProduktFormular({
  produkt,
  materialien,
  textildaten,
  nachhaltigkeit,
  guided = false,
}: {
  guided?: boolean;
  produkt: Product;
  materialien: Material[];
  textildaten: Textildaten | null;
  nachhaltigkeit: Nachhaltigkeit | null;
}) {
  const { editor, formRef, state } = useEditor();
  const pending = state.pending;
  const [step, setStep] = useState<number | null>(guided ? 0 : null);
  const focusStep = useRef<"step" | "basis" | null>(null);
  useLayoutEffect(() => {
    if (!focusStep.current) return;
    const basis = focusStep.current === "basis";
    focusStep.current = null;
    const target = basis ? formRef.current?.querySelector<HTMLElement>("summary") : step === null
      ? document.querySelector<HTMLElement>("#dokumente input")
      : formRef.current?.querySelectorAll<HTMLDetailsElement>("fieldset details")[step]?.querySelector<HTMLElement>("summary");
    target?.focus();
  }, [step, formRef]);
  function changeStep(next: number | null, basis = false) { focusStep.current = basis ? "basis" : "step"; setStep(next); }
  const steps = ["Basis", "Material", "Herkunft & Produktdetails", "Pflege", "Nutzung & Kreislauf"];

  // Pflichtfelder (PP-010) kontrolliert halten, damit wir live sehen, was fehlt.
  // Kein natives `required` → Entwurf bleibt trotz Lücke speicherbar (PP-011).
  const [name, setName] = useState(produkt.name ?? "");
  const [description, setDescription] = useState(produkt.description ?? "");
  const [category, setCategory] = useState(produkt.category ?? "");

  const fehltName = name.trim() === "";
  const fehltDescription = description.trim() === "";
  const fehltCategory = category.trim() === "";

  const statusText = pending ? "Speichert …" : state.error ? "Nicht gespeichert" : state.dirty ? "Nicht gespeicherte Änderungen" : state.saved ? "Gespeichert" : "";

  return (
    <form
      ref={formRef}
      noValidate
      onChange={editor.change}
      onSubmit={(event) => { event.preventDefault(); startTransition(() => editor.save()); }}
      className="space-y-5"
    >
      {produkt.status === "veroeffentlicht" && <Alert><AlertDescription>Sie bearbeiten den Entwurf. Automatisches Speichern verändert den veröffentlichten Pass nicht. Übernehmen Sie Änderungen anschließend mit „Veröffentlichung aktualisieren“.</AlertDescription></Alert>}
      {step !== null && <div className="space-y-3 rounded-lg border p-4">
        <p className="font-medium">Schritt {step + 1} von {steps.length}: {steps[step]}</p>
        <p className="text-sm text-muted-foreground">Zuerst die Basis ausfüllen, danach optionale Angaben ergänzen. Am Ende Dokumente und Vorschau prüfen.</p>
        <Button type="button" variant="ghost" onClick={() => changeStep(null, true)}>Alle Abschnitte anzeigen</Button>
      </div>}
      <fieldset inert={state.publishing} className="space-y-5">
      <div hidden={step !== null && step !== 0}>
      <details open className="space-y-4 rounded-lg border p-5">
        <summary className="cursor-pointer font-medium">Basis</summary>
        <div className="space-y-1.5">
          <Label htmlFor="article_number">Artikelnummer (optional, nur intern)</Label>
          <Input id="article_number" name="article_number" maxLength={120} defaultValue={produkt.article_number ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Produktname *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={fehltName || undefined}
            aria-describedby={fehltName ? "name-fehler" : undefined}
            className={fehltName ? FEHLT_KLASSE : undefined}
          />
          {fehltName && (
            <p id="name-fehler" className="text-sm text-destructive">Pflichtfeld – bitte ausfüllen.</p>
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
            aria-describedby={fehltDescription ? "description-fehler" : undefined}
            className={fehltDescription ? FEHLT_KLASSE : undefined}
          />
          {fehltDescription && (
            <p id="description-fehler" className="text-sm text-destructive">Pflichtfeld – bitte ausfüllen.</p>
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
            aria-describedby={fehltCategory ? "category-fehler" : undefined}
            className={fehltCategory ? FEHLT_KLASSE : undefined}
          />
          {fehltCategory && (
            <p id="category-fehler" className="text-sm text-destructive">Pflichtfeld – bitte ausfüllen.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brand">Marke</Label>
          <Input id="brand" name="brand" defaultValue={produkt.brand ?? ""} />
        </div>
      </details>
      </div>

      <div hidden={step !== null && step !== 1}><MaterialAbschnitt materialien={materialien} onStructureChange={editor.change} /></div>

      <div hidden={step !== null && step !== 2}><ProduktdetailsAbschnitt textildaten={textildaten} /></div>

      <div hidden={step !== null && step !== 3}><PflegeAbschnitt textildaten={textildaten} /></div>

      <div hidden={step !== null && step !== 4}><KreislaufAbschnitt nachhaltigkeit={nachhaltigkeit} /></div>

      {step !== null && <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => changeStep(step - 1)}>Zurück</Button>
        <Button className="h-auto min-h-9 whitespace-normal text-left" type="button" variant="outline" onClick={() => {
          if (step < steps.length - 1) changeStep(step + 1);
          else changeStep(null);
        }}>{step < steps.length - 1 ? "Weiter" : "Weiter zu Dokumenten und Vorschau"}</Button>
      </div>}
      </fieldset>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
          {state.conflict && <Link href={`/produkte/${produkt.id}`} target="_blank" rel="noopener noreferrer" className="text-sm underline">Aktuellen Serverstand zum Vergleichen in neuem Tab öffnen</Link>}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {statusText}
        </span>
        <Button type="submit" disabled={pending || state.publishing || state.conflict}>
          {pending ? "Wird gespeichert …" : state.conflict ? "Konflikt – neu laden" : state.error ? "Erneut speichern" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
