import Link from "next/link";
import type { ReactNode } from "react";

export function OeffentlicherSeitenrahmen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
            aria-label="lotsora Startseite"
          >
            lotsora
          </Link>
          <span className="text-xs text-muted-foreground">Website im Aufbau</span>
        </div>
      </header>

      {children}

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} lotsora</span>
          <Link href="/datenschutz" className="underline underline-offset-4">
            Datenschutz
          </Link>
        </div>
      </footer>
    </div>
  );
}
