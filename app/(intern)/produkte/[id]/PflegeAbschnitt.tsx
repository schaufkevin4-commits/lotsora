// app/(intern)/produkte/[id]/PflegeAbschnitt.tsx
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Textildaten } from "@/lib/services/products";

// Pflege (product_textile_data, 1:1 — dieselbe Zeile wie „Herkunft & Produktdetails").
// Unkontrollierte Felder mit defaultValue; Service + Action stehen bereits.
export function PflegeAbschnitt({ textildaten }: { textildaten: Textildaten | null }) {
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="font-medium">Pflege</h2>
        <p className="text-sm text-muted-foreground">
          Pflege- und Waschhinweise – optional.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="care_instructions">Pflegehinweise</Label>
        <Textarea
          id="care_instructions"
          name="care_instructions"
          defaultValue={textildaten?.care_instructions ?? ""}
          placeholder="z. B. Nicht bügeln, nicht bleichen"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wash_instructions">Waschhinweise</Label>
        <Textarea
          id="wash_instructions"
          name="wash_instructions"
          defaultValue={textildaten?.wash_instructions ?? ""}
          placeholder="z. B. Waschbar bei 30 °C, Feinwaschgang"
        />
      </div>
    </section>
  );
}