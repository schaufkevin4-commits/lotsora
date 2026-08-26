"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  dokumentHochladen,
  dokumentLoeschen,
  type DokumentFormState,
} from "./dokument-actions";
import { DOKUMENT_TYPEN, type DokumentMitUrl } from "@/lib/services/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const initial: DokumentFormState = { ok: false, error: null };

// Lösch-Knopf mit echtem Bestätigungs-Dialog (shadcn) – funktioniert in jedem
// Browser, auch im eingebetteten. Gleicher Stil wie das Produkt-Löschen.
function EntfernenButton({
  id,
  productId,
  name,
}: {
  id: string;
  productId: string;
  name: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Entfernen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument entfernen?</DialogTitle>
          <DialogDescription>
            {name.trim() ? `„${name}"` : "Dieses Dokument"} wird dauerhaft
            gelöscht. Das lässt sich nicht rückgängig machen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <form action={dokumentLoeschen.bind(null, id, productId)}>
            <Button type="submit" variant="destructive">
              Endgültig löschen
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DokumenteAbschnitt({
  productId,
  dokumente,
}: {
  productId: string;
  dokumente: DokumentMitUrl[];
}) {
  const [state, formAction, pending] = useActionState(
    dokumentHochladen.bind(null, productId),
    initial,
  );

  // Nach erfolgreichem Upload das Formular wieder leeren.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="space-y-5 rounded-lg border p-5">
      <div>
        <h2 className="font-medium">Dokumente</h2>
        <p className="text-sm text-muted-foreground">
          Zertifikate, Prüfberichte, Datenblätter … Alle Dokumente sind zunächst
          nur intern sichtbar. Das öffentliche Freigeben kommt später.
        </p>
      </div>

      {/* --- Hochlade-Formular --- */}
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="datei">Datei</Label>
          <Input id="datei" name="datei" type="file" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dok_name">Dokumentname</Label>
            <Input
              id="dok_name"
              name="dok_name"
              placeholder="z. B. OEKO-TEX Zertifikat (leer = Dateiname)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc_type">Typ</Label>
            <select
              id="doc_type"
              name="doc_type"
              defaultValue=""
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">– bitte wählen –</option>
              {DOKUMENT_TYPEN.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Optional: kurze Notiz zum Dokument"
          />
        </div>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {pending ? "Lädt hoch …" : state.ok ? "Hochgeladen" : ""}
          </span>
          <Button type="submit" disabled={pending}>
            {pending ? "Lädt hoch …" : "Dokument hochladen"}
          </Button>
        </div>
      </form>

      {/* --- Liste vorhandener Dokumente --- */}
      {dokumente.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Dokumente hochgeladen.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {dokumente.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{d.name}</span>
                  <Badge variant="secondary">intern</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {d.doc_type ? `${d.doc_type} · ` : ""}
                  {d.file_name ?? "Datei"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.signedUrl && (
                  <a
                    href={d.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Öffnen
                  </a>
                )}
                <EntfernenButton id={d.id} productId={productId} name={d.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}