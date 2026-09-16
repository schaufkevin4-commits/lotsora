"use client";

import { startTransition, useState } from "react";
import { produktVeroeffentlichung } from "./actions";
import { useEditor } from "./EditorProvider";
import type { ProductStatus } from "@/lib/services/products";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";

export function VeroeffentlichenAbschnitt({ productId, status, fehlendePflichtfelder, materialSumme }: {
  productId: string; status: ProductStatus; fehlendePflichtfelder: string[]; materialSumme: number;
}) {
  const { editor, state } = useEditor();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = status === "veroeffentlicht";
  const blocked = editor.isBlocked();
  const missing = fehlendePflichtfelder.length > 0;

  function changePublication(publish: boolean) {
    const version = editor.beginPublication();
    if (version === null) { setError("Bitte Änderungen zuerst speichern und laufende Vorgänge abwarten."); return; }
    setError(null);
    startTransition(async () => {
      let result;
      try { result = await produktVeroeffentlichung(productId, version, publish); }
      catch { result = { ok: false, error: "Statuswechsel konnte nicht bestätigt werden. Bitte neu laden und den Status prüfen." }; }
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
          ? "Das Produkt ist veröffentlicht. Gespeicherte Änderungen können im öffentlichen Pass erscheinen – auch durch automatisches Speichern."
          : "Prüfen Sie alle Angaben und die Vorschau, bevor Sie das Produkt veröffentlichen."}
      </p>
      <p className="text-sm text-muted-foreground">Öffentlich freigegebene Dokumente werden mit dem Produkt sichtbar.</p>
      {blocked && <p role="status" className="text-sm">{state.publishing ? "Statuswechsel läuft …" : "Bitte Änderungen zuerst speichern und laufende Vorgänge abwarten. Vorschau und Veröffentlichung verwenden den bestätigten Stand."}</p>}
      {!published && missing && <p className="text-sm text-destructive">Es fehlen im gespeicherten Stand: {fehlendePflichtfelder.join(", ")}.</p>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex flex-wrap gap-3">
        {blocked ? <Button variant="outline" disabled>Vorschau</Button> :
          <Button asChild variant="outline"><Link href={`/produkte/${productId}/vorschau`} target="_blank" rel="noopener noreferrer">Vorschau</Link></Button>}
        {published ? <Button variant="outline" disabled={blocked} onClick={() => changePublication(false)}>Veröffentlichung aufheben</Button> : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button disabled={blocked || missing}>Veröffentlichen</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Produkt veröffentlichen?</DialogTitle>
                <DialogDescription>Das Produkt wird über seinen dauerhaften Link öffentlich erreichbar. Spätere gespeicherte Änderungen können ebenfalls öffentlich erscheinen. Sie können die Veröffentlichung jederzeit aufheben.</DialogDescription>
              </DialogHeader>
              {materialSumme < 100 && <Alert><AlertDescription>Die Materialanteile ergeben {materialSumme}% statt 100%. Prüfen Sie, ob Angaben fehlen. Sie können trotzdem veröffentlichen.</AlertDescription></Alert>}
              {blocked && <p role="status">Bitte erst den Speichervorgang abschließen.</p>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={state.publishing}>Abbrechen</Button></DialogClose>
                <Button disabled={blocked || missing} onClick={() => changePublication(true)}>{state.publishing ? "Wird veröffentlicht …" : "Jetzt veröffentlichen"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
}
