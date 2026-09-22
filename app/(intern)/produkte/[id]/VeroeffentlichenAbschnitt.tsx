"use client";

import { startTransition, useState } from "react";
import { produktVeroeffentlichung } from "./actions";
import { useEditor } from "./EditorProvider";
import type { ProductStatus, PublicationReview } from "@/lib/services/products";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";

export function VeroeffentlichenAbschnitt({ productId, status, publication, fehlendePflichtfelder, materialSumme }: {
  productId: string; status: ProductStatus; publication: PublicationReview; fehlendePflichtfelder: string[]; materialSumme: number;
}) {
  const { editor, state } = useEditor();
  const [open, setOpen] = useState(false);
  const [reviewToken, setReviewToken] = useState(publication.token);
  const [error, setError] = useState<string | null>(null);
  const published = status === "veroeffentlicht";
  const blocked = editor.isBlocked();
  const missing = fehlendePflichtfelder.length > 0;
  function openReview(value: boolean) {
    if (value) {
      setReviewToken(publication.token);
      setError(null);
    }
    setOpen(value);
  }
  function changePublication(publish: boolean) {
    const version = editor.beginPublication();
    if (version === null) { setError("Bitte Änderungen zuerst speichern und laufende Vorgänge abwarten."); return; }
    setError(null);
    startTransition(async () => {
      let result;
      try { result = await produktVeroeffentlichung(productId, version, publish, publish ? reviewToken : publication.token); }
      catch { result = { ok: false, error: "Veröffentlichung konnte nicht bestätigt werden. Bitte neu laden und den Stand prüfen." }; }
      editor.endPublication(result);
      setError(result.error);
      if (result.ok) setOpen(false);
    });
  }
  return (
    <section id="veroeffentlichung" className="space-y-3 rounded-lg border p-5">
      <h2 className="font-medium">Veröffentlichung</h2>
      <p className="text-sm text-muted-foreground">
        {published
          ? publication.has_changes ? "Der bisherige Pass bleibt öffentlich. Im Entwurf gibt es noch nicht veröffentlichte Änderungen." : "Der gespeicherte Stand ist veröffentlicht."
          : "Der Entwurf ist privat. Prüfen Sie die Vorschau vor der Veröffentlichung."}
      </p>
      <p className="text-sm text-muted-foreground">Die Freigabe übernimmt Produktangaben, Bild, ausgewählte Dokumente und die aktuellen öffentlichen Firmenangaben gemeinsam. Der QR-Link bleibt gleich.</p>
      {publication.published_at && <p className="text-sm text-muted-foreground">Zuletzt veröffentlicht: {new Date(publication.published_at).toLocaleString("de-DE", {timeZone:"Europe/Berlin"})}</p>}
      {blocked && <p role="status" className="text-sm">{state.publishing ? "Veröffentlichung läuft …" : "Bitte Änderungen zuerst speichern und laufende Vorgänge abwarten."}</p>}
      {missing && <p className="text-sm text-destructive">Im Entwurf fehlen: {fehlendePflichtfelder.join(", ")}. {published ? "Der bisherige öffentliche Stand bleibt erhalten." : ""}</p>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex flex-wrap gap-3">
        {blocked ? <Button variant="outline" disabled>Entwurf ansehen</Button> :
          <Button asChild variant="outline"><Link href={`/produkte/${productId}/vorschau`} target="_blank" rel="noopener noreferrer">Entwurf ansehen</Link></Button>}
        <Dialog open={open} onOpenChange={openReview}>
          <DialogTrigger asChild><Button disabled={blocked || missing || (published && !publication.has_changes)}>{published ? "Veröffentlichung aktualisieren" : "Veröffentlichen"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{published ? "Öffentlichen Pass aktualisieren?" : "Produkt veröffentlichen?"}</DialogTitle>
              <DialogDescription>Der gespeicherte Entwurf einschließlich Bild, ausgewählter Dokumente und Firmenangaben wird öffentlich sichtbar. Spätere Bearbeitungen bleiben privat, bis Sie erneut aktualisieren. Prüfen Sie vorher die Entwurfsvorschau.</DialogDescription>
            </DialogHeader>
            {materialSumme < 100 && <Alert><AlertDescription>Die Materialanteile ergeben {materialSumme}% statt 100%. Prüfen Sie, ob Angaben fehlen. Sie können trotzdem veröffentlichen.</AlertDescription></Alert>}
            {blocked && <p role="status">Bitte erst den Speichervorgang abschließen.</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={state.publishing}>Abbrechen</Button></DialogClose>
              <Button disabled={blocked || missing} onClick={() => changePublication(true)}>{state.publishing ? "Wird veröffentlicht …" : published ? "Jetzt aktualisieren" : "Jetzt veröffentlichen"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {published && <Button variant="outline" disabled={blocked} onClick={() => changePublication(false)}>Veröffentlichung aufheben</Button>}
      </div>
    </section>
  );
}
