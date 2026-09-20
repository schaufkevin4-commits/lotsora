"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeletionPreview } from "@/lib/services/account-deletion";
import { deletionAction, type DeletionState } from "./actions";

export function Loeschbereich({ preview, initial, isOwner }: { preview: DeletionPreview | null; initial?: DeletionState; isOwner: boolean }) {
  const [state, action, pending] = useActionState(deletionAction, initial ?? {});
  const retry = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.complete && state.deleteSelf) { router.replace("/konto-geloescht"); return; }
    if (state.jobId && !state.complete && !state.failed && !state.error && !pending) {
      const timer = setTimeout(() => retry.current?.requestSubmit(), 1500);
      return () => clearTimeout(timer);
    }
  }, [state, pending, router]);
  if (state.jobId) return <section className="space-y-4 rounded-lg border p-5" aria-labelledby="loeschstatus">
    <h2 id="loeschstatus" className="text-xl font-semibold">{state.complete ? "Löschung abgeschlossen" : "Löschung wird abgeschlossen"}</h2>
    <p role="status" aria-live="polite">{state.complete ? "Die ausgewählten Daten und Konten sind gelöscht. Nicht zur Löschung ausgewählte Konten bleiben erhalten." : "Der Firmenzugriff ist bereits beendet. Der gespeicherte Auftrag bereinigt noch Dateien und die ausgewählten Konten."}</p>
    <p className="text-sm text-muted-foreground">{state.companyDeleted ? "Öffentliche Pass-Adressen zeigen keine Produktdaten mehr. Ihre IDs bleiben dauerhaft reserviert." : "Gemeinsame Firmendaten, Dokumente und öffentliche Produktpässe bleiben erhalten."}</p>
    {!state.complete && <form ref={retry} action={action} className="space-y-3">
      <input type="hidden" name="intent" value="continue" /><input type="hidden" name="job_id" value={state.jobId} />
      {state.failed && <p role="alert">Die Bereinigung konnte noch nicht vollständig abgeschlossen werden. Der Auftrag bleibt erhalten. Bitte erneut versuchen.</p>}
      {state.error && <p role="alert">{state.error}</p>}
      <Button disabled={pending}>{pending ? "Wird geprüft …" : "Bereinigung fortsetzen"}</Button>
    </form>}
    {state.complete && !state.deleteSelf && <p>Dein Konto bleibt bestehen. Du kannst eine neue Teameinladung annehmen oder dein eigenes Konto über diese Seite separat löschen. <a className="underline" href="/konto">Kontoseite neu öffnen</a></p>}
  </section>;

  return <div className="space-y-8">
    {state.error && <p role="alert" className="rounded-md border border-destructive p-4 text-destructive">{state.error}</p>}
    {preview && <section className="space-y-5 rounded-lg border border-destructive/40 p-5" aria-labelledby="firma-loeschen">
      <div><h2 id="firma-loeschen" className="text-xl font-semibold">Firma endgültig löschen</h2><p className="mt-2">Du löschst <strong>{preview.companyName}</strong> mit dem gesamten gemeinsamen Datenbestand.</p></div>
      <dl className="grid grid-cols-2 gap-3 rounded-md bg-muted p-4 text-sm sm:grid-cols-4">
        <div><dt>Produkte</dt><dd className="text-xl font-semibold">{preview.products}</dd></div>
        <div><dt>Öffentliche Pässe</dt><dd className="text-xl font-semibold">{preview.published}</dd></div>
        <div><dt>Dokumente</dt><dd className="text-xl font-semibold">{preview.documents}</dd></div>
        <div><dt>Dateien &amp; Uploads</dt><dd className="text-xl font-semibold">{preview.files}</dd></div>
      </dl>
      <div><h3 className="font-medium">Betroffene Mitarbeiter</h3>{preview.members.filter(m => !m.owner).length ? <ul className="mt-2 list-disc space-y-1 pl-5">{preview.members.filter(m => !m.owner).map(m => <li key={m.id} className="break-all">{m.email}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Keine weiteren Mitarbeiter. Du bist das einzige Firmenmitglied.</p>}</div>
      <p>Alle verlieren ab Löschbeginn den Firmenzugriff. Produkte, Dokumente und Bilder werden entfernt. Bestehende QR-Codes führen anschließend auf eine neutrale Hinweisseite; die IDs werden niemals wiederverwendet.</p>
      <p className="text-sm text-muted-foreground">Sichere benötigte Produktdaten und lade Dokumente vorab herunter. Du kannst jetzt noch zurückgehen und den Zeitpunkt selbst wählen. Nach dem Start lässt sich die Löschung nicht zurücknehmen. Bereits ausgegebene Dateilinks können kurzzeitig weiter funktionieren; heruntergeladene Kopien werden nicht zurückgerufen.</p>
      <form action={action} className="space-y-5">
        <input type="hidden" name="intent" value="company" /><input type="hidden" name="company_id" value={preview.companyId} /><input type="hidden" name="fingerprint" value={preview.fingerprint} />
        <fieldset className="space-y-2"><legend className="mb-2 font-semibold">Auch alle persönlichen Mitarbeiterkonten endgültig löschen?</legend>
          <label className="flex items-start gap-3"><input className="mt-1 size-4 shrink-0" type="radio" name="delete_members" value="yes" required disabled={pending} /><span>Ja, alle oben aufgeführten Mitarbeiterkonten samt Anmeldung endgültig löschen.</span></label>
          <label className="flex items-start gap-3"><input className="mt-1 size-4 shrink-0" type="radio" name="delete_members" value="no" required disabled={pending} /><span>Nein, persönliche Konten behalten. Nur Firmenzugehörigkeit und Firmenzugriff enden.</span></label>
        </fieldset>
        <fieldset className="space-y-2"><legend className="mb-2 font-semibold">Dein eigenes Konto ebenfalls endgültig löschen?</legend>
          <label className="flex items-start gap-3"><input className="mt-1 size-4 shrink-0" type="radio" name="delete_self" value="yes" required disabled={pending} /><span>Ja, mein Konto nach der Bereinigung ebenfalls löschen.</span></label>
          <label className="flex items-start gap-3"><input className="mt-1 size-4 shrink-0" type="radio" name="delete_self" value="no" required disabled={pending} /><span>Nein, mein persönliches Konto behalten.</span></label>
        </fieldset>
        <label className="block space-y-2"><span>Zur Bestätigung den Firmennamen eingeben: <strong>{preview.companyName}</strong></span><Input name="company_name" required autoComplete="off" disabled={pending} /></label>
        <label className="block space-y-2"><span>Dein aktuelles Passwort</span><Input name="password" type="password" required autoComplete="current-password" disabled={pending} /></label>
        <label className="flex items-start gap-3"><input className="mt-1 size-4 shrink-0" type="checkbox" name="understood" value="yes" required disabled={pending} /><span>Ich habe benötigte Daten gesichert, die betroffenen Mitarbeiter und Kontoauswahlen geprüft und verstanden, dass die Löschung endgültig ist.</span></label>
        <div className="flex flex-wrap items-center gap-4"><Button variant="destructive" disabled={pending}>{pending ? "Löschung wird gestartet …" : "Firma jetzt endgültig löschen"}</Button><Link href="/profil" className="underline">Abbrechen und zurück</Link></div>
      </form>
    </section>}
    <section className="space-y-4 rounded-lg border p-5" aria-labelledby="konto-loeschen"><h2 id="konto-loeschen" className="text-xl font-semibold">Nur mein persönliches Konto löschen</h2>
      {isOwner ? <p>Solange du Firmenverantwortlicher bist, musst du zuerst <Link className="underline" href="/team">die Verantwortung an ein Teammitglied übertragen</Link> oder die Firma oben ausdrücklich löschen. Der Firmenbestand wird niemals als Nebenwirkung deiner Kontolöschung entfernt.</p> : <form action={action} className="space-y-4">
        <p>Deine Anmeldung und eine bestehende Firmenmitgliedschaft werden entfernt. Gemeinsame Produkte, Dokumente und andere Konten bleiben erhalten.</p>
        <input type="hidden" name="intent" value="account" />
        <label className="block space-y-2"><span>Zur Bestätigung KONTO LÖSCHEN eingeben</span><Input name="confirmation" required autoComplete="off" disabled={pending} /></label>
        <label className="block space-y-2"><span>Dein aktuelles Passwort</span><Input name="password" type="password" required autoComplete="current-password" disabled={pending} /></label>
        <label className="flex items-start gap-3"><input className="mt-1 size-4 shrink-0" name="understood" type="checkbox" value="yes" required disabled={pending} /><span>Benötigte Daten sind gesichert. Ich möchte mein Konto endgültig löschen.</span></label>
        <Button variant="destructive" disabled={pending}>{pending ? "Löschung wird gestartet …" : "Mein Konto endgültig löschen"}</Button>
      </form>}
    </section>
  </div>;
}
