import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMeineProdukte } from "@/lib/services/products";
import { neuesProduktAnlegen } from "./actions";
import { StatusBadge } from "@/components/produkte/status-badge";
import { Button } from "@/components/ui/button";

export default async function ProdukteSeite() {
  const supabase = await createClient();
  const produkte = await getMeineProdukte(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produkte</h1>
        <form action={neuesProduktAnlegen}>
          <Button type="submit">+ Neues Produkt</Button>
        </form>
      </div>

      {produkte.length === 0 ? (
        <p className="text-muted-foreground">
          Noch keine Produkte. Leg mit „+ Neues Produkt" dein erstes an.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Zuletzt geändert</th>
              </tr>
            </thead>
            <tbody>
              {produkte.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link
                      href={`/produkte/${p.id}`}
                      className="font-medium hover:underline"
                    >
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