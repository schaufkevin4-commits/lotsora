import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { getDeletionPreview } from "@/lib/services/account-deletion";
import { abmelden } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
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
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><Link href="/profil" className="text-sm underline">Zurück zum Profil</Link><form action={abmelden}><Button variant="ghost" size="sm">Abmelden</Button></form></div>
    <div><h1 className="text-2xl font-semibold">Konto &amp; Firmenlöschung</h1><p className="mt-2 break-all text-muted-foreground">Angemeldet als {user.email}</p></div>
    {!company && !jobs.data && <FirmenEinstieg />}
    <Loeschbereich preview={preview} isOwner={isOwner} initial={jobs.data ? { jobId: jobs.data.id, deleteSelf: jobs.data.delete_self, companyDeleted: jobs.data.company_id !== null } : undefined} />
  </main>;
}
