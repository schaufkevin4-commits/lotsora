import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { getMeineProdukte, zaehleNachStatus } from "@/lib/services/products";
import { getDatenluecken } from "@/lib/services/completeness";
import { neuesProduktAnlegen } from "../produkte/actions";
import { StatusBadge } from "@/components/produkte/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Seitentitel } from "@/components/layout/seitentitel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [hersteller, produkte] = await Promise.all([
    getMeinHersteller(supabase), getMeineProdukte(supabase),
  ]);
  const zahlen = zaehleNachStatus(produkte);
  const luecken = await getDatenluecken(supabase, produkte);
  const pflichtluecken = luecken.filter(p => p.required.length > 0);
  const entwuerfe = luecken.filter(p => produkte.find(product => product.id === p.id)?.status !== "veroeffentlicht");
  const naechstes = entwuerfe.find(p => p.required.length === 0) ?? entwuerfe[0] ?? pflichtluecken[0];

  return <div className="space-y-6">
    <Seitentitel titel="Dashboard" kontext={hersteller?.company_name} beschreibung="Deine Produkte im Überblick und der nächste Schritt."
      aktion={produkte.length > 0 && <form action={neuesProduktAnlegen}><Button type="submit">+ Neues Produkt</Button></form>} />

    {produkte.length === 0 ? <Card>
      <CardHeader><CardTitle><h2>Dein erster Produktpass</h2></CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Produkt anlegen → Angaben ergänzen → Vorschau prüfen → veröffentlichen und QR-Code teilen.</p>
        <form action={neuesProduktAnlegen}><Button type="submit">Erstes Produkt anlegen</Button></form>
      </CardContent>
    </Card> : <>
      <div className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Produktübersicht">
        {[
          { label: "Gesamt", value: zahlen.gesamt, href: "/produkte" },
          { label: "Öffentlich", value: zahlen.veroeffentlicht, href: "/produkte?status=veroeffentlicht" },
          { label: "Entwürfe", value: zahlen.entwuerfe, href: "/produkte?status=privat" },
        ].map(item => <Link key={item.label} href={item.href} className="min-w-0 space-y-2 rounded-lg border p-3 hover:bg-muted/40 sm:p-5">
          <span className="block text-xs text-muted-foreground sm:text-sm">{item.label}</span>
          <span className="block text-2xl font-semibold sm:text-3xl">{item.value}</span>
        </Link>)}
      </div>

      <Card>
        <CardHeader><CardTitle><h2>{naechstes ? "Hier weitermachen" : "Alle Produkte sind veröffentlicht"}</h2></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {naechstes ? <>
            <p className="font-medium break-words">{naechstes.name?.trim() || "Produkt ohne Namen"}</p>
            <p className="text-sm text-muted-foreground">{naechstes.required.length
              ? `Im Entwurf fehlen noch: ${naechstes.required.join(", ")}.`
              : "Die Pflichtangaben sind ausgefüllt. Prüfe die Vorschau und entscheide, ob du den Pass veröffentlichen möchtest."}</p>
            <Button asChild><Link href={`/produkte/${naechstes.id}#${naechstes.required.length ? "produktdaten" : "veroeffentlichung"}`}>
              {naechstes.required.length ? "Angaben ergänzen" : "Veröffentlichung prüfen"}
            </Link></Button>
          </> : <p className="text-sm text-muted-foreground">Neue Änderungen speichert ihr zunächst intern. Prüft beim jeweiligen Produkt, ob ihr den öffentlichen Stand aktualisieren möchtet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 sm:flex-row">
          <CardTitle><h2>Zuletzt bearbeitet</h2></CardTitle>
          <Link href="/produkte" className="text-sm underline underline-offset-4">Alle Produkte</Link>
        </CardHeader>
        <CardContent className="divide-y">
          {produkte.slice(0, 5).map(p => <Link key={p.id} href={`/produkte/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:underline">
            <span className="min-w-0 flex-1 break-words"><span className="font-medium">{p.name?.trim() || "(ohne Namen)"}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}</span></span>
            <StatusBadge status={p.status} />
          </Link>)}
        </CardContent>
      </Card>

      <details className="rounded-lg border p-4 sm:p-5">
        <summary className="cursor-pointer font-medium">Angaben prüfen{pflichtluecken.length > 0 ? ` · ${pflichtluecken.length} mit fehlenden Pflichtangaben` : " · freiwillige Ergänzungen"}</summary>
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-muted-foreground">Bezieht sich auf gespeicherte Entwürfe. Freiwillige Ergänzungen verhindern die Veröffentlichung nicht.</p>
          {[...pflichtluecken, ...luecken.filter(p => !p.required.length && p.optional.length)].slice(0, 5).map(p => <div key={p.id} className="space-y-1">
            <Link href={`/produkte/${p.id}#produktdaten`} className="font-medium underline break-words">{p.name?.trim() || "(ohne Namen)"}</Link>
            {p.required.length > 0 && <p>Pflichtangaben: {p.required.join(", ")}.</p>}
            {p.optional.length > 0 && <p className="text-muted-foreground">Freiwillig: {p.optional.join(", ")}.</p>}
          </div>)}
          {!luecken.some(p => p.required.length || p.optional.length) && <p>Die betrachteten Angaben sind vollständig ausgefüllt.</p>}
          <Link href="/produkte" className="inline-block underline">Alle Produkte ansehen</Link>
        </div>
      </details>
    </>}
  </div>;
}
