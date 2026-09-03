// app/p/[id]/page.tsx
// Öffentliche Produktpass-Seite (Tag 27, PP-013). Kein Login (Middleware schützt
// nur /dashboard, /profil, /produkte). Anonyme Besucher sehen über RLS nur die
// öffentlichen Felder veröffentlichter Produkte. Nicht veröffentlicht/unbekannt
// ⇒ neutrale Hinweisseite statt 404 (PP-013 E3).

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getOeffentlicherPass } from "@/lib/services/products";
import { ProduktPass } from "@/components/produkte/produkt-pass";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: publicId } = await params;
  const supabase = await createClient();
  const pass = await getOeffentlicherPass(supabase, publicId);
  if (!pass) return { title: "Produktpass" };
  return {
    title: `${pass.produkt.name} – Produktpass`,
    description: pass.produkt.description.slice(0, 160),
  };
}

export default async function OeffentlicherPassSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: publicId } = await params;
  const supabase = await createClient();
  const pass = await getOeffentlicherPass(supabase, publicId);

  if (!pass) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Produktpass nicht verfügbar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Produktpass ist derzeit nicht verfügbar.
        </p>
        <p className="mt-8 text-xs text-muted-foreground">Bereitgestellt über lotsora</p>
      </main>
    );
  }

  return (
    <main>
      <ProduktPass pass={pass} />
    </main>
  );
}
