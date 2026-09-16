// app/(intern)/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { getMeineProdukte, zaehleNachStatus } from "@/lib/services/products";
import { getDatenluecken } from "@/lib/services/completeness";
import { neuesProduktAnlegen } from "../produkte/actions";
import { StatusBadge } from "@/components/produkte/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [hersteller, produkte] = await Promise.all([
    getMeinHersteller(supabase), // RLS: nur die eigene Zeile
    getMeineProdukte(supabase),
  ]);

  const begruessung = `Willkommen${hersteller?.company_name ? `, ${hersteller.company_name}` : ""}`;

  // --- Empty-State (Tag 19): noch keine Produkte -----------------------------
  if (produkte.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{begruessung}</h1>
          <p className="text-muted-foreground">Leg dein erstes Produkt an und teile den QR-Code.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Erste Schritte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Erstes Produkt anlegen</li>
              <li>Daten ausfüllen</li>
              <li>Veröffentlichen</li>
              <li>QR-Code teilen</li>
            </ol>
            <Button asChild>
              <Link href="/produkte">Erstes Produkt anlegen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Befüllt (Screen 8): Kacheln + kurze Produktliste ----------------------
  const zahlen = zaehleNachStatus(produkte);
  const letzte = produkte.slice(0, 5);
  const luecken = await getDatenluecken(supabase, produkte);
  const naechstesProdukt = luecken.find((p) => p.required.length === 0) ?? luecken[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{begruessung}</h1>
        <form action={neuesProduktAnlegen}>
          <Button type="submit">+ Neues Produkt</Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produkte gesamt</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{zahlen.gesamt}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Veröffentlicht</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{zahlen.veroeffentlicht}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entwürfe &amp; Unvollständig</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{zahlen.entwuerfe}</CardContent>
        </Card>
      </div>

      {zahlen.veroeffentlicht === 0 && <Card>
        <CardHeader><CardTitle>Erste Schritte zum Produktpass</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Produkt angelegt ✓</li>
            <li>{naechstesProdukt.required.length ? "Pflichtangaben ergänzen" : "Pflichtangaben ausgefüllt ✓"}</li>
            <li>Angaben und Vorschau prüfen, dann veröffentlichen</li>
            <li>QR-Code teilen</li>
          </ol>
          <Button asChild><Link href={`/produkte/${naechstesProdukt.id}`}>Mit Produkt fortfahren</Link></Button>
        </CardContent>
      </Card>}

      <Card>
        <CardHeader><CardTitle>Datenlücken</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Orientierung zu Pflichtangaben, Material, Herkunft, Pflege und Kreislauf. Optionale Angaben bleiben freiwillig.</p>
          {luecken.slice(0, 5).map((p) => <div key={p.id}>
            <Link href={`/produkte/${p.id}`} className="font-medium underline">{p.name || "(ohne Namen)"}: {p.label}</Link>
            {p.required.length > 0 && <p>Pflichtangaben fehlen: {p.required.join(", ")}.</p>}
            {p.optional.length > 0 && <p>Optional ergänzen: {p.optional.join(", ")}.</p>}
          </div>)}
          {luecken.length > 5 && <Link href="/produkte" className="underline">Weitere Produkte prüfen</Link>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Letzte Produkte</CardTitle>
          <Link href="/produkte" className="text-sm text-muted-foreground hover:underline">
            Alle ansehen
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {letzte.map((p) => (
            <Link
              key={p.id}
              href={`/produkte/${p.id}`}
              className="flex items-center justify-between py-2 hover:underline"
            >
              <span><span className="font-medium">{p.name?.trim() ? p.name : "(ohne Namen)"}</span><span className="block text-xs text-muted-foreground">Zuletzt geändert: {new Date(p.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</span></span>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
