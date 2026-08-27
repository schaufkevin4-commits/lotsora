"use client";

import { useActionState } from "react";
import {
  produktVeroeffentlichen,
  produktZurueckziehen,
  type VeroeffentlichenState,
} from "./actions";
import type { ProductStatus } from "@/lib/services/products";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initial: VeroeffentlichenState = { ok: false, reasons: [] };

export function VeroeffentlichenAbschnitt({
  productId,
  status,
  fehlendePflichtfelder,
  materialSumme,
}: {
  productId: string;
  status: ProductStatus;
  fehlendePflichtfelder: string[];
  materialSumme: number;
}) {
  const [state, formAction, pending] = useActionState(
    produktVeroeffentlichen.bind(null, productId),
    initial,
  );
  const istVeroeffentlicht = status === "veroeffentlicht";
  const istGesperrt = fehlendePflichtfelder.length > 0;

  if (istVeroeffentlicht) {
    return (
      <section className="space-y-3 rounded-lg border p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-medium">Veröffentlichung</h2>
            <p className="text-sm text-muted-foreground">
              Das Produkt ist veröffentlicht. Freigegebene Dokumente sind damit für
              die öffentliche Ausgabe freigeschaltet.
            </p>
          </div>
          <form action={produktZurueckziehen.bind(null, productId)}>
            <Button type="submit" variant="outline">
              Veröffentlichung aufheben
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-medium">Veröffentlichung</h2>
          <p className="text-sm text-muted-foreground">
            Veröffentlichen Sie das Produkt erst, wenn alle Angaben geprüft sind.
          </p>
        </div>

        {istGesperrt ? (
          <Button disabled>Veröffentlichen</Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Veröffentlichen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Produkt veröffentlichen?</DialogTitle>
                <DialogDescription>
                  Das Produkt wird öffentlich über seinen dauerhaften Link und später
                  über den QR-Code erreichbar. Öffentlich freigegebene Dokumente werden
                  dabei sichtbar. Sie können die Veröffentlichung jederzeit wieder
                  aufheben.
                </DialogDescription>
              </DialogHeader>

              {materialSumme < 100 && (
                <Alert>
                  <AlertDescription>
                    Die Materialanteile ergeben {materialSumme}% statt 100%. Prüfen Sie,
                    ob Angaben fehlen. Sie können trotzdem veröffentlichen.
                  </AlertDescription>
                </Alert>
              )}

              {state.reasons.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4">
                      {state.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={pending}>
                    Abbrechen
                  </Button>
                </DialogClose>
                <form action={formAction}>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Wird veröffentlicht …" : "Jetzt veröffentlichen"}
                  </Button>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {istGesperrt && (
        <Alert variant="destructive">
          <AlertDescription>
            Veröffentlichen ist noch gesperrt. Es fehlen: {fehlendePflichtfelder.join(", ")}.
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
