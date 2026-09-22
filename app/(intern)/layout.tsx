import { Arbeitsbereich } from "@/components/layout/arbeitsbereich";
// app/(intern)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return <Arbeitsbereich>
    {firma ? children : <><h1 className="sr-only">Firmenzugang wählen</h1><FirmenEinstieg /></>}
  </Arbeitsbereich>;
}
