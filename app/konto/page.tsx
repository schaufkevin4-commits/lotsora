import { Arbeitsbereich } from "@/components/layout/arbeitsbereich";
import { Seitentitel } from "@/components/layout/seitentitel";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { getDeletionPreview } from "@/lib/services/account-deletion";
import { Loeschbereich } from "./Loeschbereich";
import { FirmenEinstieg } from "@/components/firma/firmen-einstieg";

export default async function KontoPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const company = await getMeinHersteller(client);
  const isOwner = company?.user_id === user.id;
  const jobs = await client.from("deletion_jobs").select("id,delete_self,company_id").eq("state", "pending").maybeSingle();
  if (jobs.error) throw new Error("Löschstatus konnte nicht geladen werden.");
  const preview = isOwner && !jobs.data ? await getDeletionPreview(client, company!.id) : null;
  return <Arbeitsbereich><div className="max-w-3xl space-y-6">
    <Seitentitel titel="Konto verwalten" beschreibung={user.email} kontext={<Link href="/profil" className="underline">Zurück zum Firmenprofil</Link>} />
    {!company && !jobs.data && <FirmenEinstieg />}
    <Loeschbereich preview={preview} isOwner={isOwner} initial={jobs.data ? { jobId: jobs.data.id, deleteSelf: jobs.data.delete_self, companyDeleted: jobs.data.company_id !== null } : undefined} />
  </div></Arbeitsbereich>;
}
