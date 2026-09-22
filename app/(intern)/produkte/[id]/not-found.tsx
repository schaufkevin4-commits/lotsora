// app/(intern)/produkte/[id]/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Seitentitel } from "@/components/layout/seitentitel";

export default function ProduktNichtGefunden() {
  return (
    <div className="max-w-2xl space-y-4">
      <Seitentitel titel="Produkt nicht gefunden" />
      <p className="text-muted-foreground">
        Dieses Produkt gibt es nicht (mehr) oder es gehört nicht zu deinem Konto.
      </p>
      <Button asChild>
        <Link href="/produkte">Zurück zu Produkte</Link>
      </Button>
    </div>
  );
}
