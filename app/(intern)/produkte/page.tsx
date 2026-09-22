import { getOffeneDateivorgaenge } from "@/lib/services/file-cleanup";
import { FileCleanupPanel } from "@/components/produkte/file-cleanup-panel";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getMeineProdukte,
  parseSort,
  standardRichtung,
  type ProduktSortKey,
  type SortRichtung,
} from "@/lib/services/products";
import { neuesProduktAnlegen } from "./actions";
import { StatusBadge } from "@/components/produkte/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Seitentitel } from "@/components/layout/seitentitel";

function SortKopf({
  wert,
  aktivKey,
  aktivDir,
  filter,
  children,
}: {
  wert: ProduktSortKey;
  aktivKey: ProduktSortKey;
  aktivDir: SortRichtung;
  filter: string;
  children: React.ReactNode;
}) {
  const istAktiv = aktivKey === wert;
  const nextDir: SortRichtung = istAktiv
    ? aktivDir === "asc"
      ? "desc"
      : "asc"
    : standardRichtung(wert);
  const pfeil = istAktiv ? (aktivDir === "asc" ? " ↑" : " ↓") : "";
  return (
    <Link
      href={`/produkte?sort=${wert}&dir=${nextDir}&${filter}`}
      className={istAktiv ? "font-semibold" : "font-medium hover:underline"}
    >
      {children}
      {pfeil}
    </Link>
  );
}

export default async function ProdukteSeite({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const { key: aktivKey, dir: aktivDir } = parseSort(sp.sort, sp.dir);

  const supabase = await createClient();
  const offeneDateivorgaenge = await getOffeneDateivorgaenge(supabase);
  const produkte = await getMeineProdukte(supabase, aktivKey, aktivDir);
  const suche = typeof sp.q === "string" ? sp.q.trim().slice(0, 200) : "";
  const status = ["privat", "veroeffentlicht", "unvollstaendig"].includes(sp.status ?? "") ? sp.status! : "";
  const sichtbar = produkte.filter(p =>
    (!suche || (p.name ?? "").toLocaleLowerCase("de").includes(suche.toLocaleLowerCase("de"))) &&
    (!status || (status === "privat" ? p.status !== "veroeffentlicht" : p.status === status)));
  const filter = new URLSearchParams({ q: suche, status }).toString();

  return (
    <div className="space-y-6">
      <Seitentitel titel="Produkte" beschreibung={`${produkte.length} ${produkte.length === 1 ? "Produkt" : "Produkte"} · Entwürfe bearbeiten und öffentliche Pässe verwalten.`}
        aktion={<form action={neuesProduktAnlegen}>
          <Button type="submit">+ Neues Produkt</Button>
        </form>} />

      {produkte.length > 0 && <form action="/produkte" method="get" className="grid items-end gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto_auto]" role="search" aria-label="Produkte suchen und filtern">
        <input type="hidden" name="sort" value={aktivKey} /><input type="hidden" name="dir" value={aktivDir} />
        <label className="min-w-0 space-y-2 text-sm font-medium" htmlFor="produktsuche">Produkt suchen
          <Input key={suche} id="produktsuche" name="q" type="search" placeholder="Produktname" defaultValue={suche} maxLength={200} />
        </label>
        <label className="space-y-2 text-sm font-medium" htmlFor="produktstatus">Status
          <select key={status} id="produktstatus" name="status" defaultValue={status} className="block h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Alle Produkte</option><option value="privat">Entwürfe</option><option value="veroeffentlicht">Veröffentlicht</option><option value="unvollstaendig">Unvollständig</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">Anwenden</Button>
        {(suche || status) && <p className="text-sm text-muted-foreground sm:col-span-3">{sichtbar.length} von {produkte.length} Produkten · <Link href={`/produkte?sort=${aktivKey}&dir=${aktivDir}`} className="underline">Filter zurücksetzen</Link></p>}
      </form>}

      {produkte.length > 0 && <div className="flex flex-wrap gap-3 text-sm sm:hidden" aria-label="Sortierung">
        <span className="text-muted-foreground">Sortieren:</span>
        <SortKopf filter={filter} wert="name" aktivKey={aktivKey} aktivDir={aktivDir}>Name</SortKopf>
        <SortKopf filter={filter} wert="status" aktivKey={aktivKey} aktivDir={aktivDir}>Status</SortKopf>
        <SortKopf filter={filter} wert="geaendert" aktivKey={aktivKey} aktivDir={aktivDir}>Datum</SortKopf>
      </div>}

      <FileCleanupPanel operations={offeneDateivorgaenge} />
      {produkte.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Noch keine Produkte. Leg mit „+ Neues Produkt“ dein erstes an.
          </p>
        </div>
      ) : sichtbar.length === 0 ? <div className="rounded-lg border border-dashed p-6 text-center text-sm"><p>Keine Produkte für diese Suche gefunden.</p><Link className="mt-2 inline-block underline" href="/produkte">Alle Produkte anzeigen</Link></div> : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">Produkte mit Status und Änderungsdatum. Über die Spaltenüberschriften sortieren.</caption>
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" aria-sort={aktivKey === "name" ? aktivDir === "asc" ? "ascending" : "descending" : "none"} className="px-3 py-3 sm:px-4">
                  <SortKopf filter={filter} wert="name" aktivKey={aktivKey} aktivDir={aktivDir}>Name</SortKopf>
                </th>
                <th scope="col" aria-sort={aktivKey === "status" ? aktivDir === "asc" ? "ascending" : "descending" : "none"} className="w-32 px-3 py-3 sm:w-40 sm:px-4">
                  <SortKopf filter={filter} wert="status" aktivKey={aktivKey} aktivDir={aktivDir}>Status</SortKopf>
                </th>
                <th scope="col" aria-sort={aktivKey === "geaendert" ? aktivDir === "asc" ? "ascending" : "descending" : "none"} className="hidden w-40 px-4 py-3 sm:table-cell">
                  <SortKopf filter={filter} wert="geaendert" aktivKey={aktivKey} aktivDir={aktivDir}>Zuletzt geändert</SortKopf>
                </th>
              </tr>
            </thead>
            <tbody>
              {sichtbar.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-3 break-words sm:px-4">
                    <Link href={`/produkte/${p.id}`} className="font-medium hover:underline">
                      {p.name?.trim() ? p.name : "(ohne Namen)"}
                    </Link>
                    <span className="mt-1 block text-xs text-muted-foreground sm:hidden">Geändert: {new Date(p.updated_at).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}</span>
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {new Date(p.updated_at).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
