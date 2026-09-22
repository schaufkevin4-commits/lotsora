import type { ReactNode } from "react";

export function Seitentitel({ titel, beschreibung, aktion, kontext }: {
  titel: string; beschreibung?: ReactNode; aktion?: ReactNode; kontext?: ReactNode;
}) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 space-y-2">
      {kontext && <div className="text-sm text-muted-foreground">{kontext}</div>}
      <h1 className="text-2xl font-semibold tracking-tight break-words">{titel}</h1>
      {beschreibung && <div className="max-w-2xl text-sm leading-6 text-muted-foreground break-words">{beschreibung}</div>}
    </div>
    {aktion && <div className="flex shrink-0 flex-wrap items-center gap-3">{aktion}</div>}
  </header>;
}
