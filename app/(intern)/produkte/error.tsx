"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Fehler({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Produkte konnten nicht geladen werden</AlertTitle>
        <AlertDescription>Da ist etwas schiefgelaufen. Bitte versuch es erneut.</AlertDescription>
      </Alert>
      <Button onClick={() => reset()}>Erneut laden</Button>
    </div>
  );
}