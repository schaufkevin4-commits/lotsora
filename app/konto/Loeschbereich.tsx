"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeletionPreview } from "@/lib/services/account-deletion";
import { deletionAction, type DeletionState } from "./actions";

type Props = { preview: DeletionPreview | null; initial?: DeletionState; isOwner: boolean };
type Choice = "company" | "account";

export function Loeschbereich(props: Props) {
  const [choice, setChoice] = useState<Choice | null>(props.initial?.jobId ? (props.initial.companyDeleted ? "company" : "account") : null);
  const selectionHeading = useRef<HTMLHeadingElement>(null);
  const previousChoice = useRef(choice);
  useEffect(() => {
    if (previousChoice.current && !choice) selectionHeading.current?.focus();
    previousChoice.current = choice;
  }, [choice]);
  if (choice) return <LoeschVorgang key={choice} {...props} choice={choice} onBack={() => setChoice(null)} />;
  return <section className="space-y-4" aria-labelledby="loeschwahl">
    <div className="space-y-1">
      <h2 ref={selectionHeading} tabIndex={-1} id="loeschwahl" className="text-lg font-semibold outline-none">Was möchtest du löschen?</h2>
      <p className="text-sm text-muted-foreground">Wähle zuerst den Bereich. Im nächsten Schritt prüfst du die Folgen und bestätigst.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {props.preview && <button type="button" onClick={() => setChoice("company")} className="group flex flex-col items-start gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="font-semibold">Firma löschen</span>
        <span className="text-sm text-muted-foreground">Den gesamten Firmenbestand entfernen. Welche persönlichen Konten bleiben, entscheidest du anschließend.</span>
        <span className="mt-auto flex items-center gap-2 text-sm font-medium">Weiter zur Firmenlöschung <ArrowRight className="size-4" aria-hidden="true" /></span>
      </button>}
      <button type="button" onClick={() => setChoice("account")} className="group flex flex-col items-start gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <UserRound className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="font-semibold">Mein Konto löschen</span>
        <span className="text-sm text-muted-foreground">Nur deine Anmeldung entfernen. Gemeinsame Firmendaten und andere Konten bleiben erhalten.</span>
        <span className="mt-auto flex items-center gap-2 text-sm font-medium">Weiter zur Kontolöschung <ArrowRight className="size-4" aria-hidden="true" /></span>
      </button>
    </div>
  </section>;
}

function Passwortfeld({ id, pending }: { id: string; pending: boolean }) {
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium">Passwort deines Benutzerkontos</label>
      <Link href="/passwort-vergessen" className="text-sm underline">Passwort vergessen?</Link>
    </div>
    <Input id={id} name="password" type="password" required autoComplete="current-password" aria-describedby={id + "-hilfe"} disabled={pending} />
    <p id={id + "-hilfe"} className="text-sm text-muted-foreground">Dein Anmeldepasswort gilt auch nach dem Anlegen einer neuen Firma.</p>
  </div>;
}

function LoeschVorgang({ preview, initial, isOwner, choice, onBack }: Props & { choice: Choice; onBack: () => void }) {
  const [state, action, pending] = useActionState(deletionAction, initial ?? {});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [state.jobId]);
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
    <h2 ref={heading} tabIndex={-1} id="loeschstatus" className="text-xl font-semibold outline-none">{state.complete ? "Löschung abgeschlossen" : "Löschung wird abgeschlossen"}</h2>
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


  const members = preview?.members.filter(member => !member.owner) ?? [];
  return <section className="space-y-5" aria-labelledby="loeschbestaetigung">
    <Button type="button" variant="ghost" onClick={onBack} disabled={pending}><ArrowLeft aria-hidden="true" /> Zurück zur Auswahl</Button>
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schritt 2 von 2 · Prüfen & bestätigen</p>
      <h2 ref={heading} tabIndex={-1} id="loeschbestaetigung" className="text-xl font-semibold outline-none">{choice === "company" ? "Firma endgültig löschen" : "Mein Konto löschen"}</h2>
    </div>
    {state.error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.error}</p>}

    {choice === "company" && preview && <>
      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="font-medium break-words">{preview.companyName}</p>
        <p className="text-sm">Alle verlieren den Firmenzugriff. Der gesamte Firmenbestand wird endgültig gelöscht. Das lässt sich nicht rückgängig machen.</p>
      </div>
      <details className="rounded-lg border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">Datenübersicht & weitere Folgen</summary>
        <div className="mt-4 space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><dt className="text-muted-foreground">Produkte</dt><dd className="text-lg font-semibold">{preview.products}</dd></div>
            <div><dt className="text-muted-foreground">Öffentliche Pässe</dt><dd className="text-lg font-semibold">{preview.published}</dd></div>
            <div><dt className="text-muted-foreground">Dokumente</dt><dd className="text-lg font-semibold">{preview.documents}</dd></div>
            <div><dt className="text-muted-foreground">Dateien & Uploads</dt><dd className="text-lg font-semibold">{preview.files}</dd></div>
          </dl>
          <p>Produkte, Dokumente und Bilder werden entfernt. Bestehende QR-Codes zeigen danach keine Produktdaten mehr; ihre IDs bleiben reserviert.</p>
          <p className="text-muted-foreground">Lade benötigte Daten vorher herunter. Bereits ausgegebene Dateilinks können kurzzeitig weiter funktionieren. Heruntergeladene Kopien werden nicht zurückgerufen.</p>
        </div>
      </details>
      <form action={action} className="space-y-5">
        <input type="hidden" name="intent" value="company" /><input type="hidden" name="company_id" value={preview.companyId} /><input type="hidden" name="fingerprint" value={preview.fingerprint} />
        {members.length > 0 ? <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Persönliche Mitarbeiterkonten ({members.length})</legend>
          <ul className="space-y-1 text-sm text-muted-foreground">{members.map(member => <li key={member.id} className="break-all">{member.email}</li>)}</ul>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <label className="flex items-center gap-2"><input className="size-4" type="radio" name="delete_members" value="no" required disabled={pending} />Konten behalten</label>
            <label className="flex items-center gap-2"><input className="size-4" type="radio" name="delete_members" value="yes" required disabled={pending} />Konten endgültig mitlöschen</label>
          </div>
          <p className="text-xs text-muted-foreground">Der Zugang zu dieser Firma endet in beiden Fällen.</p>
        </fieldset> : <><input type="hidden" name="delete_members" value="no" /><p className="text-sm text-muted-foreground">Keine weiteren Mitarbeiterkonten betroffen.</p></>}
        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Dein persönliches Konto</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <label className="flex items-center gap-2"><input className="size-4" type="radio" name="delete_self" value="no" required disabled={pending} />Konto behalten</label>
            <label className="flex items-center gap-2"><input className="size-4" type="radio" name="delete_self" value="yes" required disabled={pending} />Konto endgültig mitlöschen</label>
          </div>
        </fieldset>
        <label className="block space-y-2 text-sm"><span className="font-medium">Firmennamen zur Bestätigung eingeben: <strong className="break-words">{preview.companyName}</strong></span><Input name="company_name" required autoComplete="off" disabled={pending} /></label>
        <Passwortfeld id="firma-passwort" pending={pending} />
        <label className="flex items-start gap-3 text-sm"><input className="mt-1 size-4 shrink-0" type="checkbox" name="understood" value="yes" required disabled={pending} /><span>Ich habe benötigte Daten gesichert, die Kontoauswahl geprüft und die endgültige Löschung verstanden.</span></label>
        <Button variant="destructive" disabled={pending}>{pending ? "Löschung wird gestartet …" : "Firma endgültig löschen"}</Button>
      </form>
    </>}

    {choice === "account" && (isOwner ? <div className="space-y-4 rounded-lg border p-5">
      <p>Du bist noch Firmenverantwortlicher. Übertrage zuerst die Verantwortung, damit die Firma ohne dein Konto weiterbestehen kann.</p>
      <Button asChild variant="outline"><Link href="/team">Verantwortung übertragen</Link></Button>
      <p className="text-sm text-muted-foreground">Soll auch der Firmenbestand gelöscht werden, wähle stattdessen die Firmenlöschung.</p>
    </div> : <form action={action} className="space-y-5">
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">Deine Anmeldung und Firmenmitgliedschaft werden endgültig entfernt. Gemeinsame Firmendaten und andere Konten bleiben erhalten.</p>
      <input type="hidden" name="intent" value="account" />
      <label className="block space-y-2 text-sm"><span className="font-medium">Zur Bestätigung KONTO LÖSCHEN eingeben</span><Input name="confirmation" required autoComplete="off" disabled={pending} /></label>
      <Passwortfeld id="konto-passwort" pending={pending} />
      <label className="flex items-start gap-3 text-sm"><input className="mt-1 size-4 shrink-0" name="understood" type="checkbox" value="yes" required disabled={pending} /><span>Benötigte Daten sind gesichert. Ich möchte mein Konto endgültig löschen.</span></label>
      <Button variant="destructive" disabled={pending}>{pending ? "Löschung wird gestartet …" : "Mein Konto endgültig löschen"}</Button>
    </form>)}
  </section>;
}
