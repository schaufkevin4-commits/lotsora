"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/dashboard", "Dashboard"], ["/produkte", "Produkte"],
  ["/profil", "Firmenprofil"], ["/team", "Team"], ["/konto", "Konto"],
] as const;

export function SprungZumInhalt() {
  return <a href="#hauptinhalt" className="sr-only focus:not-sr-only focus:block focus:p-3" onClick={event => {
    const main = document.getElementById("hauptinhalt");
    if (main) {
      event.preventDefault();
      main.focus();
      main.scrollIntoView();
    }
  }}>Zum Hauptinhalt</a>;
}

export function Hauptnavigation() {
  const pathname = usePathname();
  return <nav aria-label="Hauptnavigation" className="flex flex-wrap gap-1 border-t pt-2">
    {links.map(([href, label]) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
        {label}
      </Link>;
    })}
  </nav>;
}
