"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Seitentitel } from "@/components/layout/seitentitel";

export default function FirmaFehler({ reset }: { reset: () => void }) {
  return <div className="max-w-2xl space-y-6">
    <Seitentitel titel="Firmenzugang nicht erreichbar" />
    <p>Dein Firmenzugang konnte gerade nicht geprüft werden. Bitte versuche es erneut.</p>
    <Button onClick={reset}>Erneut versuchen</Button>
    <p><Link href="/konto" className="underline">Zur Kontoverwaltung</Link></p>
  </div>;
}
