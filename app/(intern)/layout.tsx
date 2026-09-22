// app/(intern)/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { abmelden } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { FirmenEinstieg } from "@/components/firma/firmen-einstieg";

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doppelter Boden zusätzlich zur Middleware.
  if (!user) redirect("/login");
  const firma = await getMeinHersteller(supabase);

  return (
    <div className="min-h-screen">
      <a href="#hauptinhalt" className="sr-only focus:not-sr-only focus:block focus:p-3">Zum Hauptinhalt</a>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <nav aria-label="Hauptnavigation" className="flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/produkte" className="hover:underline">Produkte</Link>
          <Link href="/profil" className="hover:underline">Profil</Link>
          <Link href="/team" className="hover:underline">Team</Link>
        </nav>
        <form action={abmelden} data-leaves-editor>
          <Button type="submit" variant="ghost" size="sm">Abmelden</Button>
        </form>
      </header>
      <main id="hauptinhalt" tabIndex={-1} className="mx-auto max-w-4xl p-4 sm:p-6">
        {firma ? children : <><h1 className="sr-only">Firmenzugang wählen</h1><FirmenEinstieg /></>}
      </main>
    </div>
  );
}
