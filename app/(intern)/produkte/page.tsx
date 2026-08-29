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

function SortKopf({
  wert,
  aktivKey,
  aktivDir,
  children,
}: {
  wert: ProduktSortKey;
  aktivKey: ProduktSortKey;
  aktivDir: SortRichtung;
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
      href={`/produkte?sort=${wert}&dir=${nextDir}`}
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
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const { key: aktivKey, dir: aktivDir } = parseSort(sp.sort, sp.dir);

  const supabase = await createClient();
  const produkte = await getMeineProdukte(supabase, aktivKey, aktivDir);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produkte</h1>
          {produkte.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {produkte.length} {produkte.length === 1 ? "Produkt" : "Produkte"}
            </p>
          )}
        </div>
        <form action={neuesProduktAnlegen}>
          <Button type="submit">+ Neues Produkt</Button>
        </form>
      </div>

      {produkte.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Noch keine Produkte. Leg mit „+ Neues Produkt“ dein erstes an.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2">
                  <SortKopf wert="name" aktivKey={aktivKey} aktivDir={aktivDir}>Name</SortKopf>
                </th>
                <th className="px-4 py-2">
                  <SortKopf wert="status" aktivKey={aktivKey} aktivDir={aktivDir}>Status</SortKopf>
                </th>
                <th className="px-4 py-2">
                  <SortKopf wert="geaendert" aktivKey={aktivKey} aktivDir={aktivDir}>Zuletzt geändert</SortKopf>
                </th>
              </tr>
            </thead>
            <tbody>
              {produkte.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/produkte/${p.id}`} className="font-medium hover:underline">
                      {p.name?.trim() ? p.name : "(ohne Namen)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("de-DE")}
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
