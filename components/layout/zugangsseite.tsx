import Link from "next/link";
import type { ReactNode } from "react";
import { Seitentitel } from "./seitentitel";

export function Zugangsseite({ titel, children }: { titel: string; children: ReactNode }) {
  return <div className="min-h-screen">
    <header className="border-b px-4 py-5 sm:px-6"><Link href="/" className="text-lg font-semibold tracking-tight" aria-label="lotsora Startseite">lotsora</Link></header>
    <main className="mx-auto w-full max-w-lg space-y-6 px-4 py-10 sm:px-6 sm:py-16">
      <Seitentitel titel={titel} />
      {children}
    </main>
  </div>;
}
