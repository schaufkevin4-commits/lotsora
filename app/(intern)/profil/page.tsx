// app/(intern)/profil/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { ProfilFormular } from "./ProfilFormular";
import { countries } from "@/lib/profile";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hersteller = await getMeinHersteller(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Profil &amp; Einstellungen</h1>

      <div className="flex flex-col gap-1 rounded-md border p-4">
        <h2 className="font-semibold">Mein Konto</h2>
        <span className="text-sm">
          Angemeldet als <strong>{user?.email}</strong>
        </span>
        <span className="text-sm text-muted-foreground">
          Rolle: {hersteller?.user_id === user?.id ? "Firmenverantwortlicher" : "Mitarbeiter"}
        </span>
      </div>

      {hersteller?.user_id === user?.id ? <ProfilFormular hersteller={hersteller} countries={countries} /> : (
        <div className="space-y-2 rounded-md border p-4">
          <h2 className="font-semibold">{hersteller?.company_name}</h2>
          <p className="text-sm text-muted-foreground">Das Firmenprofil wird vom Firmenverantwortlichen verwaltet. Produkte und Dokumente bearbeitet ihr gemeinsam.</p>
        </div>
      )}
    </div>
  );
}
