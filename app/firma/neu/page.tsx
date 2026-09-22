import { Seitentitel } from "@/components/layout/seitentitel";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanyEntryState } from "@/lib/services/company-entry";
import { FirmenFormular } from "./FirmenFormular";

export default async function NeueFirmaPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const state = await getCompanyEntryState(client);
  return <div className="max-w-2xl space-y-6">
    <Seitentitel titel="Eigene Firma anlegen" beschreibung="Richte den gemeinsamen Arbeitsbereich für deine Firma ein." />
    {state === "ready" ? <FirmenFormular requestId={randomUUID()} /> : <section className="space-y-3">
      <p>{state === "member" ? "Dein Konto gehört bereits zu einer Firma. Pro Konto ist eine Firmenzugehörigkeit möglich."
        : state === "deleting" ? "Für dein Konto läuft noch ein Löschvorgang. Schließe ihn zuerst ab, bevor du einen neuen Firmenbereich anlegst."
        : "Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deiner Registrierungsmail und melde dich danach erneut an."}</p>
      <Link href={state === "member" ? "/dashboard" : "/konto"} className="underline">
        {state === "member" ? "Bestehende Firma öffnen" : "Zur Kontoverwaltung"}
      </Link>
    </section>}
  </div>;
}
