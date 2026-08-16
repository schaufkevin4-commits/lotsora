// app/(intern)/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const hersteller = await getMeinHersteller(supabase); // RLS: nur die eigene Zeile

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Willkommen{hersteller?.company_name ? `, ${hersteller.company_name}` : ""}
        </h1>
        <p className="text-muted-foreground">Leg dein erstes Produkt an und teile den QR-Code.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Erste Schritte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Erstes Produkt anlegen</li>
            <li>Daten ausfüllen</li>
            <li>Veröffentlichen</li>
            <li>QR-Code teilen</li>
          </ol>
          <Button asChild>
            <Link href="/produkte">Erstes Produkt anlegen</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}