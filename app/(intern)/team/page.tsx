import { Seitentitel } from "@/components/layout/seitentitel";
import { createClient } from "@/lib/supabase/server";
import { getMeinHersteller } from "@/lib/services/manufacturers";
import { EinladenFormular, TeamAenderung } from "./TeamFormulare";

export default async function TeamPage() {
  const supabase = await createClient();
  const [{ data: { user } }, firma, members] = await Promise.all([
    supabase.auth.getUser(), getMeinHersteller(supabase), supabase.rpc("list_company_members"),
  ]);
  if (!firma || !user) return null;
  if (members.error) throw new Error("Team konnte nicht geladen werden.");
  const owner = firma.user_id === user.id;
  const invitations = owner ? await supabase.from("company_invitations")
    .select("id,email,expires_at").eq("manufacturer_id", firma.id)
    .is("revoked_at", null).is("accepted_at", null).gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false }) : null;
  if (invitations?.error) throw new Error("Einladungen konnten nicht geladen werden.");
  return <div className="space-y-6">
    <Seitentitel titel="Team" kontext={firma.company_name} beschreibung="Teammitglieder, Zugänge und Einladungen an einem Ort." />
    <section aria-labelledby="members-heading" className="space-y-4">
      <h2 id="members-heading" className="text-lg font-semibold">Teammitglieder ({members.data.length})</h2>
      <ul className="divide-y rounded-lg border">
        {members.data.map(member => <li key={member.user_id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-all text-sm font-medium">{member.email}{member.user_id === user.id ? " (du)" : ""}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs">{member.role === "owner" ? "Firmenverantwortlicher" : "Mitarbeiter"}</span>
          </div>
          {owner && member.role !== "owner" && <details className="space-y-3">
            <summary className="cursor-pointer text-sm underline">Zugang und Rolle verwalten</summary>
            <TeamAenderung id={member.user_id} intent="remove" label="Aus Team entfernen" explanation="Diese Person verliert den Zugriff auf eure Firma. Ihre Produkte und Dateien bleiben für das Team erhalten." />
            <TeamAenderung id={member.user_id} intent="transfer" label="Verantwortung übergeben" explanation="Diese Person verwaltet künftig Firma und Team. Du wirst Mitarbeiter und kannst weiter Produkte bearbeiten. Offene Einladungen werden widerrufen." />
          </details>}
        </li>)}
      </ul>
      <p className="text-sm text-muted-foreground">Alle Teammitglieder können Produkte, Dokumente und Veröffentlichungen bearbeiten. Der Firmenverantwortliche verwaltet zusätzlich das Firmenprofil und die Teamzugänge.</p>
    </section>
    {owner ? <>
      <details className="space-y-4 rounded-lg border p-4 sm:p-6">
        <summary className="cursor-pointer font-semibold">Mitarbeiter einladen</summary>
        <p className="text-sm text-muted-foreground">Eine Einladung gilt für genau eine E-Mail-Adresse. Neue Mitarbeiter registrieren sich über den Einladungslink, ohne eine eigene Firma anzulegen.</p>
        <EinladenFormular />
      </details>
      <section aria-labelledby="pending-heading" className="space-y-3">
        <h2 id="pending-heading" className="text-lg font-semibold">Offene Einladungen ({invitations?.data?.length ?? 0})</h2>
        {invitations?.data?.length ? <ul className="divide-y rounded-lg border">{invitations.data.map(invitation => <li key={invitation.id} className="space-y-2 p-4">
          <p className="break-all text-sm font-medium">{invitation.email}</p>
          <p className="text-xs text-muted-foreground">Gültig bis {new Date(invitation.expires_at).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}</p>
          <TeamAenderung id={invitation.id} intent="revoke" label="Einladung widerrufen" explanation="Dieser Einladungslink kann danach nicht mehr verwendet werden." />
        </li>)}</ul> : <p className="text-sm text-muted-foreground">Keine offenen Einladungen.</p>}
      </section>
    </> : <p className="rounded-lg bg-muted p-4 text-sm">Weitere Teammitglieder kann euer Firmenverantwortlicher einladen.</p>}
  </div>;
}
