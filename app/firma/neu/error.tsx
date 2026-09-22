"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FirmaFehler({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
    <h1 className="text-2xl font-semibold">Firmenzugang nicht erreichbar</h1>
    <p>Dein Firmenzugang konnte gerade nicht geprüft werden. Bitte versuche es erneut.</p>
    <Button onClick={reset}>Erneut versuchen</Button>
    <p><Link href="/konto" className="underline">Zur Kontoverwaltung</Link></p>
  </main>;
}
