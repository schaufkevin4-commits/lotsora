// components/produkte/produkt-pass.tsx
// Öffentliche Produktpass-Anzeige (Tag 27, PP-013 E4/E5/E6).
// Reine Anzeige: bekommt die fertigen Daten als Prop, holt selbst nichts.
// Genutzt von der öffentlichen Seite /p/<id> UND der Editor-Vorschau.
// Feste Sektionsreihenfolge (E4); leere Felder/Sektionen werden ausgeblendet (E2).

import Link from "next/link";
import type { ReactNode } from "react";
import type { OeffentlicherPass } from "@/lib/services/products";
import { PassBild } from "@/components/produkte/pass-bild";
import { Seitentitel } from "@/components/layout/seitentitel";

const DISCLAIMER =
  "Die Angaben auf dieser Seite stammen vom Hersteller. Diese Angaben werden nicht geprüft; es werden keine Compliance- oder Rechtsversprechen gemacht.";

function hatText(wert: string | null | undefined): wert is string {
  return typeof wert === "string" && wert.trim().length > 0;
}

function abschnittId(titel: string) {
  return `pass-${titel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section id={abschnittId(titel)} aria-labelledby={`${abschnittId(titel)}-titel`} className="scroll-mt-6 space-y-3 border-t pt-6">
      <h2 id={`${abschnittId(titel)}-titel`} className="text-lg font-semibold">{titel}</h2>
      {children}
    </section>
  );
}

// Beschriftung/Wert-Zeile – zeigt sich nur, wenn ein Wert vorhanden ist.
function ZeileWenn({ label, wert }: { label: string; wert: string | null | undefined }) {
  if (!hatText(wert)) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm whitespace-pre-line break-words">{wert}</dd>
    </div>
  );
}

export function ProduktPass({
  pass,
  vorschau = false,
}: {
  pass: OeffentlicherPass;
  vorschau?: boolean;
}) {
  const {
    produkt,
    hersteller,
    materialien,
    textildaten: t,
    nachhaltigkeit: n,
    dokumente,
  } = pass;

  const datum = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(
    new Date(produkt.updated_at),
  );

  const bild = produkt.image_url;
  const website = hersteller?.website ?? null;

  const hatHersteller =
    !!hersteller &&
    (hatText(hersteller.company_name) || hatText(hersteller.country) || hatText(website));
  const hatDetails =
    !!t && (hatText(t.origin_country) || hatText(t.color) || hatText(t.size));
  const hatPflege =
    !!t && (hatText(t.care_instructions) || hatText(t.wash_instructions));
  const hatKreislauf =
    !!n &&
    (hatText(n.recycling_notes) ||
      hatText(n.repair_notes) ||
      hatText(n.disposal_notes) ||
      hatText(n.reusable_materials));

  const inhalt = [
    { titel: "Hersteller", sichtbar: hatHersteller },
    { titel: "Beschreibung", sichtbar: hatText(produkt.description) },
    { titel: "Material", sichtbar: materialien.length > 0 },
    { titel: "Produktdetails", sichtbar: hatDetails },
    { titel: "Pflege", sichtbar: hatPflege },
    { titel: "Nutzung & Kreislauf", sichtbar: hatKreislauf },
    { titel: "Dokumente", sichtbar: dokumente.length > 0 },
  ].filter(item => item.sichtbar);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 break-words sm:px-6 sm:py-8">
      {vorschau && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vorschau – so sehen Besucher den Produktpass. Diese Seite ist noch nicht
          veröffentlicht.
        </div>
      )}

      {hatText(bild) && (
        <PassBild key={bild} src={bild} alt={produkt.name} />
      )}

      <Seitentitel titel={produkt.name} kontext="Digitaler Produktpass"
        beschreibung={`${produkt.category}${hatText(produkt.brand) ? ` · ${produkt.brand}` : ""}`} />

      {inhalt.length > 1 && <nav aria-label="Inhalt des Produktpasses" className="mt-6 rounded-lg border p-4">
        <p className="mb-2 text-sm font-medium">Direkt zum Abschnitt</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">{inhalt.map(item => <li key={item.titel}>
          <a href={`#${abschnittId(item.titel)}`} className="inline-flex min-h-10 items-center text-sm underline underline-offset-4">{item.titel}</a>
        </li>)}</ul>
      </nav>}

      <div className="mt-6 space-y-6">
        {hatHersteller && (
          <Abschnitt titel="Hersteller">
            <dl className="space-y-1.5">
              <ZeileWenn label="Firma" wert={hersteller?.company_name} />
              <ZeileWenn label="Land" wert={hersteller?.country} />
              {hatText(website) && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="w-40 shrink-0 text-sm text-muted-foreground">Website</dt>
                  <dd className="min-w-0 text-sm break-all">
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-primary underline underline-offset-4"
                    >
                      {website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </Abschnitt>
        )}

        {hatText(produkt.description) && (
          <Abschnitt titel="Beschreibung">
            <p className="text-sm whitespace-pre-line">{produkt.description}</p>
          </Abschnitt>
        )}

        {materialien.length > 0 && (
          <Abschnitt titel="Material">
            <ul className="space-y-2.5">
              {materialien.map((m) => {
                const pct = m.percentage === null ? null : Number(m.percentage);
                const breite = pct === null ? 0 : Math.min(100, Math.max(0, pct));
                return (
                  <li key={m.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{m.material_name}</span>
                      {pct !== null && (
                        <span className="text-muted-foreground">{pct}%</span>
                      )}
                    </div>
                    {pct !== null && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${breite}%` }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Abschnitt>
        )}

        {hatDetails && (
          <Abschnitt titel="Produktdetails">
            <dl className="space-y-1.5">
              <ZeileWenn label="Herkunftsland" wert={t?.origin_country} />
              <ZeileWenn label="Farbe" wert={t?.color} />
              <ZeileWenn label="Größe" wert={t?.size} />
            </dl>
          </Abschnitt>
        )}

        {hatPflege && (
          <Abschnitt titel="Pflege">
            <dl className="space-y-1.5">
              <ZeileWenn label="Pflegehinweise" wert={t?.care_instructions} />
              <ZeileWenn label="Waschhinweise" wert={t?.wash_instructions} />
            </dl>
          </Abschnitt>
        )}

        {hatKreislauf && (
          <Abschnitt titel="Nutzung & Kreislauf">
            <dl className="space-y-1.5">
              <ZeileWenn label="Recycling" wert={n?.recycling_notes} />
              <ZeileWenn label="Reparatur" wert={n?.repair_notes} />
              <ZeileWenn label="Entsorgung" wert={n?.disposal_notes} />
              <ZeileWenn
                label="Wiederverwendbare Materialien"
                wert={n?.reusable_materials}
              />
            </dl>
          </Abschnitt>
        )}

        {dokumente.length > 0 && (
          <Abschnitt titel="Dokumente">
            <ul className="space-y-2">
              {dokumente.map((d) => (
                <li key={d.id}>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      {d.name}
                    </a>
                  ) : (
                    <span className="text-sm">{d.name}</span>
                  )}
                  {hatText(d.doc_type) && (
                    <span className="ml-2 text-xs text-muted-foreground">{d.doc_type}</span>
                  )}
                </li>
              ))}
            </ul>
          </Abschnitt>
        )}

        <footer className="space-y-3 border-t pt-6 text-xs text-muted-foreground">
          <div className="space-y-0.5">
            <p>{vorschau ? "Entwurf zuletzt gespeichert" : "Zuletzt veröffentlicht"}: {datum}</p>
            <p>Pass-ID: {produkt.public_id}</p>
          </div>
          <p>{DISCLAIMER}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Bereitgestellt über lotsora</p>
            <Link href="/datenschutz" className="underline underline-offset-4">
              Datenschutz
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
