import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FirmenEinstieg() {
  return <section className="space-y-5" aria-labelledby="firmen-einstieg">
    <div className="space-y-2">
      <h2 id="firmen-einstieg" className="text-2xl font-semibold">Keine Firmenzugehörigkeit</h2>
      <p>Dein Konto gehört aktuell zu keiner Firma. Wie möchtest du weiterarbeiten?</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="space-y-3 rounded-lg border p-5">
        <h3 className="font-semibold">Ich gehöre zu einer bestehenden Firma</h3>
        <p className="text-sm text-muted-foreground">Bitte den Firmenverantwortlichen um eine Teameinladung und öffne den erhaltenen Link. Melde dich mit der E-Mail-Adresse an, an die sich die Einladung richtet.</p>
        <p className="text-sm">Du brauchst dafür keinen eigenen Firmenbereich anzulegen.</p>
      </section>
      <section className="space-y-3 rounded-lg border p-5">
        <h3 className="font-semibold">Ich möchte eine eigene Firma verwalten</h3>
        <p className="text-sm text-muted-foreground">Lege mit deinem bestehenden Konto einen neuen, leeren Firmenbereich an. Du übernimmst dafür die Verantwortung.</p>
        <Button variant="outline" asChild><Link href="/firma/neu">Eigene Firma anlegen</Link></Button>
      </section>
    </div>
    <p className="text-sm"><Link className="underline underline-offset-4" href="/konto">Konto verwalten oder Löschvorgang fortsetzen</Link></p>
  </section>;
}
