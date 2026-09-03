import type { Metadata } from "next";
import Link from "next/link";
import { OeffentlicherSeitenrahmen } from "@/components/oeffentlich/seitenrahmen";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzhinweise zum Platzhalter auf lotsora.de.",
};

const linkKlassen = "underline underline-offset-4 hover:text-foreground";

function Abschnitt({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{titel}</h2>
      <div className="space-y-3 leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Datenschutzseite() {
  return (
    <OeffentlicherSeitenrahmen>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <article className="space-y-10">
          <header className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className={linkKlassen}>
                ← Zur Startseite
              </Link>
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Datenschutz
            </h1>
            <p className="text-sm text-muted-foreground">Stand: 3. September 2026</p>
          </header>

          <Abschnitt titel="Platzhalterseite">
            <p>
              Diese öffentliche Startseite ist derzeit ausschließlich ein technischer
              Platzhalter. Sie enthält kein Angebot, keine Registrierung, kein
              Kontaktformular und keine Reichweitenmessung.
            </p>
          </Abschnitt>

          <Abschnitt titel="Technische Bereitstellung">
            <p>
              Beim Aufruf werden technisch erforderliche Zugriffsdaten verarbeitet.
              Dazu können insbesondere IP-Adresse, Datum und Uhrzeit, aufgerufene
              Adresse, Referrer, Browser- und Betriebssysteminformationen sowie der
              Antwortstatus gehören.
            </p>
            <p>
              Die Verarbeitung dient der sicheren und zuverlässigen Auslieferung der
              Seite, der Fehlerdiagnose und dem Schutz vor Missbrauch. Rechtsgrundlage
              ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt im
              sicheren und funktionsfähigen Betrieb der Website.
            </p>
            <p>
              Hosting-Anbieter ist Vercel Inc., USA. Eine Verarbeitung außerhalb des
              Europäischen Wirtschaftsraums kann stattfinden. Vercel nennt das EU-US
              Data Privacy Framework und Standardvertragsklauseln als
              Schutzmechanismen. Weitere Informationen enthält die {" "}
              <a
                href="https://vercel.com/legal/privacy-notice"
                target="_blank"
                rel="noopener noreferrer"
                className={linkKlassen}
              >
                Datenschutzerklärung von Vercel
              </a>
              .
            </p>
          </Abschnitt>

          <Abschnitt titel="Cookies und externe Inhalte">
            <p>
              Die Platzhalterseite setzt selbst keine Cookies ein und bindet keine
              Analyse-, Werbe-, Social-Media- oder Marketingdienste ein. Schriftarten
              und sonstige Darstellungsressourcen werden mit der Anwendung
              ausgeliefert und beim Seitenaufruf nicht von Google geladen.
            </p>
          </Abschnitt>

          <Abschnitt titel="Speicherdauer und Rechte">
            <p>
              Zugriffsdaten werden nur so lange verarbeitet, wie dies für den sicheren
              Betrieb, die Fehleranalyse und gesetzliche Pflichten erforderlich ist.
              Betroffene Personen haben nach Maßgabe der DSGVO insbesondere Rechte auf
              Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und
              Widerspruch sowie ein Beschwerderecht bei einer zuständigen
              Datenschutzaufsichtsbehörde.
            </p>
          </Abschnitt>

          <p className="border-t pt-6 text-xs leading-5 text-muted-foreground">
            Diese Hinweise werden angepasst, bevor die Startseite um weitere
            Funktionen oder externe Dienste erweitert wird.
          </p>
        </article>
      </main>
    </OeffentlicherSeitenrahmen>
  );
}
