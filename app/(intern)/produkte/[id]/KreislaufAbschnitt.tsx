// app/(intern)/produkte/[id]/KreislaufAbschnitt.tsx
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Nachhaltigkeit } from "@/lib/services/products";

// Nutzung & Kreislauf (product_sustainability, 1:1). Alles optional.
export function KreislaufAbschnitt({
  nachhaltigkeit,
}: {
  nachhaltigkeit: Nachhaltigkeit | null;
}) {
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="font-medium">Nutzung &amp; Kreislauf</h2>
        <p className="text-sm text-muted-foreground">
          Recycling, Reparatur, Entsorgung und wiederverwendbare Materialien – optional.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recycling_notes">Recyclinghinweise</Label>
        <Textarea
          id="recycling_notes"
          name="recycling_notes"
          defaultValue={nachhaltigkeit?.recycling_notes ?? ""}
          placeholder="z. B. Über Alttextilsammlung recycelbar"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="repair_notes">Reparaturhinweise</Label>
        <Textarea
          id="repair_notes"
          name="repair_notes"
          defaultValue={nachhaltigkeit?.repair_notes ?? ""}
          placeholder="z. B. Nähte nachnähbar, Ersatzknöpfe beiliegend"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="disposal_notes">Entsorgungshinweise</Label>
        <Textarea
          id="disposal_notes"
          name="disposal_notes"
          defaultValue={nachhaltigkeit?.disposal_notes ?? ""}
          placeholder="z. B. Nicht im Restmüll entsorgen"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reusable_materials">Wiederverwendbare Materialien</Label>
        <Textarea
          id="reusable_materials"
          name="reusable_materials"
          defaultValue={nachhaltigkeit?.reusable_materials ?? ""}
          placeholder="z. B. Reißverschluss und Knöpfe wiederverwendbar"
        />
      </div>
    </section>
  );
}