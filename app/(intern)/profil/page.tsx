// app/(intern)/profil/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { ProfilFormular } from "./ProfilFormular";

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
        <span className="text-sm text-muted-foreground">Konto</span>
        <span className="text-sm">
          Angemeldet als <strong>{user?.email}</strong>
        </span>
      </div>

      <ProfilFormular hersteller={hersteller} />
    </div>
  );
}