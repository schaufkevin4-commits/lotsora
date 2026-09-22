import Link from "next/link";
import type { ReactNode } from "react";
import { abmelden } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Hauptnavigation, SprungZumInhalt } from "./hauptnavigation";

// Nur der gemeinsame Rahmen. Authentifizierung und Firmenprüfung bleiben in den Routen.
export function Arbeitsbereich({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">
    <SprungZumInhalt />
    <header className="border-b">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight" aria-label="lotsora Dashboard">lotsora</Link>
          <form action={abmelden} data-leaves-editor><Button type="submit" variant="ghost" size="sm">Abmelden</Button></form>
        </div>
        <Hauptnavigation />
      </div>
    </header>
    <main id="hauptinhalt" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
  </div>;
}
