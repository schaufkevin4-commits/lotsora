// app/(intern)/produkte/[id]/ProduktdetailsAbschnitt.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Textildaten } from "@/lib/services/products";

// Herkunft / Produktdetails (product_textile_data, 1:1). Alles optional.
export function ProduktdetailsAbschnitt({
  textildaten,
}: {
  textildaten: Textildaten | null;
}) {
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="font-medium">Herkunft &amp; Produktdetails</h2>
        <p className="text-sm text-muted-foreground">
          Herkunftsland, Farbe und Größe – alle optional.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="origin_country">Herkunftsland</Label>
        <Input
          id="origin_country"
          name="origin_country"
          defaultValue={textildaten?.origin_country ?? ""}
          placeholder="z. B. Portugal"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="color">Farbe</Label>
          <Input
            id="color"
            name="color"
            defaultValue={textildaten?.color ?? ""}
            placeholder="z. B. Schwarz"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="size">Größe</Label>
          <Input
            id="size"
            name="size"
            defaultValue={textildaten?.size ?? ""}
            placeholder="z. B. M"
          />
        </div>
      </div>
    </section>
  );
}