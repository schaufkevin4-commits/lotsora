import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProdukt } from "@/lib/services/products";
import { produktSpeichern } from "./actions";
import { StatusBadge } from "@/components/produkte/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function ProduktEditorSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const produkt = await getProdukt(supabase, id);
  if (!produkt) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produkt bearbeiten</h1>
        <StatusBadge status={produkt.status} />
      </div>

      <form action={produktSpeichern.bind(null, produkt.id)} className="space-y-5">
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-medium">Basis</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Produktname *</Label>
            <Input id="name" name="name" defaultValue={produkt.name ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Produktbeschreibung *</Label>
            <Textarea id="description" name="description" defaultValue={produkt.description ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Produktkategorie *</Label>
            <Input id="category" name="category" defaultValue={produkt.category ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand">Marke</Label>
            <Input id="brand" name="brand" defaultValue={produkt.brand ?? ""} />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit">Speichern</Button>
        </div>
      </form>
    </div>
  );
}