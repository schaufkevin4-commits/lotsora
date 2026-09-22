"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Tabs } from "radix-ui";
import { useEditor } from "./EditorProvider";
import type { PublicationReview } from "@/lib/services/products";

type Bereich = "produktdaten" | "dateien" | "veroeffentlichung";
const bereiche: { id: Bereich; label: string }[] = [
  { id: "produktdaten", label: "Produktdaten" },
  { id: "dateien", label: "Dateien" },
  { id: "veroeffentlichung", label: "Veröffentlichung" },
];
function currentSection(): Bereich {
  if (["#dateien", "#dokumente", "#bild"].includes(window.location.hash)) return "dateien";
  if (["#veroeffentlichung", "#qr-code"].includes(window.location.hash)) return "veroeffentlichung";
  return "produktdaten";
}
function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
export function zeigeEditorBereich(bereich: Bereich) {
  // Bestehende Next-Historydaten erhalten; Bereichswechsel verlässt das Formular nicht.
  window.history.replaceState(window.history.state, "", `#${bereich}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function EditorBereiche({ daten, dateien, veroeffentlichung, published, publication }: {
  daten: ReactNode; dateien: ReactNode; veroeffentlichung: ReactNode;
  published: boolean; publication: PublicationReview;
}) {
  const bereich = useSyncExternalStore(subscribe, currentSection, () => "produktdaten" as Bereich);
  const { state } = useEditor();
  const changes = publication.has_changes || state.dirty || state.pending;
  return (
    <div className="space-y-5">
      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4" aria-label="Entwurf und öffentlicher Stand">
        <div className="space-y-1">
          <p className="text-sm font-medium">{published ? "Öffentlicher Pass aktiv" : "Noch nicht veröffentlicht"}</p>
          <p className="text-sm text-muted-foreground">{published
            ? changes ? "Änderungen im Entwurf – der öffentliche Pass bleibt unverändert." : "Entwurf und öffentlicher Pass sind auf demselben Stand."
            : "Dein Entwurf ist nur für dein Firmenteam sichtbar."}</p>
        </div>
        <span role="status" className="text-sm">{state.error ? "Nicht gespeichert" : state.pending ? "Speichert …" : state.dirty ? "Ungespeicherte Änderungen" : "Produktdaten gespeichert"}</span>
      </aside>
      {state.error && bereich !== "produktdaten" && <p role="alert" className="text-sm text-destructive">
        Beim Speichern gibt es ein Problem. <button type="button" className="underline" onClick={() => zeigeEditorBereich("produktdaten")}>Produktdaten prüfen</button>
      </p>}
      <Tabs.Root value={bereich} onValueChange={value => zeigeEditorBereich(value as Bereich)} className="space-y-5">
        <Tabs.List aria-label="Produkt bearbeiten" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {bereiche.map(item => <Tabs.Trigger key={item.id} value={item.id}
            className="min-h-11 min-w-0 rounded-md px-2 py-2 text-xs font-medium break-words hyphens-auto text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-sm">
            {item.label}
          </Tabs.Trigger>)}
        </Tabs.List>
        {/* Eingaben und Uploadauswahl bleiben beim Wechsel im DOM und im FormData. */}
        <Tabs.Content value="produktdaten" forceMount className="space-y-5 data-[state=inactive]:hidden">{daten}</Tabs.Content>
        <Tabs.Content value="dateien" forceMount className="space-y-5 data-[state=inactive]:hidden">{dateien}</Tabs.Content>
        <Tabs.Content value="veroeffentlichung" forceMount className="space-y-5 data-[state=inactive]:hidden">{veroeffentlichung}</Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
