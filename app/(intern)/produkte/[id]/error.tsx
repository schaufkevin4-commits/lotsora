// app/(intern)/produkte/[id]/error.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Fehler({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-2xl space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Produkt konnte nicht geladen werden</AlertTitle>
        <AlertDescription>Da ist etwas schiefgelaufen. Bitte versuch es erneut.</AlertDescription>
      </Alert>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Erneut laden</Button>
        <Button variant="ghost" asChild>
          <Link href="/produkte">Zurück zu Produkte</Link>
        </Button>
      </div>
    </div>
  );
}