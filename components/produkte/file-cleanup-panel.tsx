"use client";

import { useActionState } from "react";
import { dateiBereinigen } from "@/app/(intern)/produkte/cleanup-actions";
import type { Dateivorgang } from "@/lib/services/file-cleanup";
import { Button } from "@/components/ui/button";

function DateivorgangZeile({ operation }: { operation: Dateivorgang }) {
  const [state, action, pending] = useActionState(
    dateiBereinigen.bind(null, operation.id, operation.product_id), { error: null },
  );
  return (
    <li className="space-y-2 border-t py-3 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-medium">{operation.file_name}</p>
          <p className="text-sm text-muted-foreground">
            {operation.state === "uploading" ? "Upload seit mindestens 15 Minuten nicht bestätigt. Bereinigen bricht einen noch laufenden Upload dieser Datei ab." : "Die Datei ist noch nicht vollständig gelöscht."}
          </p>
        </div>
        <form action={action}>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Wird bereinigt …" : "Datei bereinigen"}
          </Button>
        </form>
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    </li>
  );
}

export function FileCleanupPanel({ operations }: { operations: Dateivorgang[] }) {
  if (operations.length === 0) return null;
  return (
    <section aria-label="Offene Dateivorgänge" className="rounded-lg border p-5">
      <h2 className="font-medium">Offene Dateivorgänge</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Diese Vorgänge bleiben gespeichert, bis die Dateien vollständig entfernt sind.
      </p>
      <ul className="mt-3">{operations.map((operation) => <DateivorgangZeile key={operation.id} operation={operation} />)}</ul>
    </section>
  );
}
