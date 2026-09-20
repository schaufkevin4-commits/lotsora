# Lokale Browserabnahme am 20.09.2026

**Status: Lokales Gate durch Kevin am 20.09.2026 ausdrücklich freigegeben.**
Technische Browserprüfung und anschließende Profilverbesserung sind abgenommen.
Übernahme und Push nach main sind ausdrücklich beauftragt.
Die verbindlichen offenen Punkte stehen in [RESTPUNKTE-GATE-2026-09-20.md](RESTPUNKTE-GATE-2026-09-20.md).

## Prüfstand und Umgebung

- Anwendung: `ccf4c5f9dbb09c9db09c801d662b720f519a4201`, Branch `codex/gate-restpunkte`.
- Lokaler Next-Entwicklungsserver auf Port 3109; ausschließlich isoliertes
  `lotsora-integration` auf API-Port 55321 mit 23 Migrationen.
- Sichtbarer Codex-Browser, synthetische Testfirma A und getrennte Testkonten
  für Firmenverantwortlichen und Mitarbeiter. Keine Kunden- oder Clouddaten.
- Fachlicher Durchlauf ab 18:20 Uhr, Europe/Berlin (UTC+02:00).
- Nach dem Durchlauf wurde ausschließlich der lokale Anmeldehelfer korrigiert
  und mit einer neuen Testsitzung erneut geprüft; produktive App-Dateien unverändert.

## Tatsächlich im Browser geprüft

| Ablauf | Beobachtetes Ergebnis |
|---|---|
| Verantwortlicher erstellt Einladungslink; lokales Bestätigungsmail wird geöffnet; passendes Konto nimmt die neue Einladung an | Team zeigt zwei Mitglieder und das eingeladene Konto als Mitarbeiter. |
| Mitarbeiter öffnet Team und Produkte | Gemeinsame Produkte sichtbar; Mitarbeiteransicht hat keine Einladungsverwaltung. |
| Mitarbeiter legt ein Produkt an und speichert Name, Beschreibung, Kategorie und interne Artikelnummer | Speichern erfolgreich; aus unvollständigem Produkt wird veröffentlichbarer Entwurf. |
| Mitarbeiter lädt eine synthetische PDF als Datenblatt hoch | Upload erfolgreich; Dokument erscheint zunächst als intern. |
| Mitarbeiter gibt das Dokument nach Dialog öffentlich frei und veröffentlicht das Produkt | Öffentliches Dokument, veröffentlichter Produktstatus und QR-Code sichtbar. |
| Abmelden und öffentlichen Pass öffnen | Name, Beschreibung, Firma und Dokumentlink sichtbar; interne Artikelnummer nicht sichtbar. |
| Öffentlichen Dokumentlink öffnen | Weiterleitung zur signierten Storage-Datei beobachtet; siehe Einschränkung unten. |
| Verantwortlicher öffnet das vom Mitarbeiter angelegte Produkt und ergänzt die Marke | Speichern erfolgreich; gemeinsamer Datenbestand im Editor und aktualisierte Marke im öffentlichen Pass sichtbar. |
| Verantwortlicher löscht das hochgeladene Testdokument über den Bestätigungsdialog | Dokument verschwindet aus Editor und öffentlichem Pass; vorheriger Dokumentlink zeigt „Datei nicht verfügbar“. |
| Verantwortlicher entfernt Mitarbeiter mit Bestätigung | Team zeigt anschließend ein Mitglied. |
| Entferntes Konto wird korrekt neu angemeldet und öffnet Team sowie direkte Produktadresse | Beide zeigen „Keine Firmenzugehörigkeit“; kein Zugriff auf den Editor. |

Testprodukt des ersten Durchlaufs: `cef85000-b04a-443b-8138-71d4177da888`,
öffentliche ID `uuJ577RnetD1`. Die temporären Datensätze wurden beim regulären
Beenden des ersten Browserhelfers durch dessen Fixture-Abbau entfernt.
Bootstrap-, Bestätigungs- und Einladungs-Token werden hier nicht abgelegt.

## Befund am lokalen Testhelfer und Nachprüfung

Beim Kontowechsel zeigte der erste Anmeldehelfer zunächst weiterhin das alte Konto.
Nach regulärem Abmelden ließ sich das Mitarbeiterkonto korrekt prüfen. Die spätere
Rückkehr zum Verantwortlichen landete dagegen auf der Loginseite: Der Helfer
verwendete dessen durch Abmelden widerrufene Sitzung erneut.
Diese Zwischenzustände wurden nicht als bestandener Rechteentzug gewertet.

`tests/integration/browser-session.test.ts` meldet jetzt jedes ausgewählte
synthetische Testkonto neu an und entfernt beim Wechsel überzählige Auth-Cookies
des vorherigen Kontos. `fixtures.ts` stellt dazu auch für bereits bestätigte
Testkonten deren ohnehin erzeugtes Testpasswort bereit. Keine produktive Loginroute
und keine produktive Cookiebehandlung wurden geändert.

Nach Neustart mit `browser --team` wurden sichtbar geprüft:

- Verantwortlicher → Konto ohne Firmenmitgliedschaft: korrekte Sperrseite.
- Zurück zum Verantwortlichen: korrekte Teamverwaltung.
- Regulär abmelden → denselben Verantwortlichenzugang erneut öffnen:
  erfolgreiche neue Anmeldung, korrekte Teamverwaltung.
- `npx tsc --noEmit` und gezieltes ESLint für beide geänderten Testdateien bestanden.

Der erste Browserhelfer wurde regulär beendet, sein Fixture-Abbau lief erfolgreich.
Sein einzelner bestandener Vitest-Helfertest zählt nicht als zusätzliche automatisierte
Fachabdeckung; die fachlichen Beobachtungen sind in der Tabelle separat beschrieben.

## Grenzen und spätere Nachweise

- Der integrierte PDF-Betrachter zeigte keine überprüfbare Seitenvorschau. Beobachtet
  wurde die Weiterleitung, nicht eine erfolgreiche visuelle PDF-Darstellung.
  Der separate Produktions-HTTP-Lauf des geprüften App-Stands hat die Dateirouten
  geprüft; seine elf Ergebnisse stehen im zentralen Prüfprotokoll.
- Die QR-Codes enthalten die kanonische Domain; lokale Passaufrufe verwendeten
  denselben öffentlichen Pfad auf localhost. Dies ist kein Cloud-Erreichbarkeitsnachweis.
- Versionskonflikte, Verantwortungsübergabe, unerlaubte direkte Storage-Löschung
  und falsche Löschziele sind durch die dokumentierten automatisierten Prüfungen
  belegt; sie wurden in diesem Browserdurchlauf nicht nochmals vollständig ausgelöst.
- Physischer QR-Druckscan und echte, separat bestätigte Screenreader-Stichprobe
  bleiben P2. Die früher bestätigten Downloads und Bildschirm-Scans ersetzen sie nicht.
- Alle weiteren P2/P3-Punkte bleiben offen. Eine lokale Gate-Freigabe beinhaltet
  weder Kundenfreigabe noch Cloud-Rollout oder Deployment.

## Abnahme durch Kevin

### Ergänzung: von Kevin beauftragte Profilverbesserung

Nach dem ursprünglichen Browserdurchlauf hat Kevin die klarere Gliederung des
Profils ausdrücklich beauftragt. Diese Ergänzung ändert nun auch produktive
Profil-Dateien; die oben beschriebene reine Testhelferkorrektur bezieht sich auf
den vorherigen Durchlauf.

- Mein Konto zeigt Anmelde-E-Mail und Firmenrolle.
- Öffentliches Firmenprofil und interne Kontaktdaten sind getrennt und mit ihrer
  Sichtbarkeit gekennzeichnet. Der Hinweis erklärt die Wirkung für die ganze Firma.
- Nur Firmenname ist Pflicht; Land des Firmensitzes ist eine optionale Auswahl
  mit deutschen Ländernamen und gespeicherten ISO-Codes. Abweichende Bestandswerte
  bleiben als bisherige Angabe auswählbar und werden nicht stillschweigend gelöscht.
- Website-Adressen werden vor dem Speichern serverseitig geprüft und ohne Schema
  um HTTPS ergänzt. Leere Angaben sind erlaubt; andere Protokolle, Zugangsdaten
  und fehlerhafte Adressen werden abgewiesen. Formulareingaben bleiben bei Fehlern erhalten.
- Telefonnummer verwendet das passende Eingabefeld; Anschrift und Ansprechpartner
  haben präzisere Beschriftungen. Nur Verantwortliche dürfen weiterhin speichern.

Nachweise am 20.09.2026, Europe/Berlin:

- 18:42:17: 17 gezielte Website-Unit-Tests bestanden.
- 18:44:08: 12 gezielte Action-Integrationstests bestanden, einschließlich neuem
  Profiltest für Normalisierung, ausbleibende Mutation bei ungültiger Website und
  verweigerte Änderung durch einen Mitarbeiter. Kein erneuter vollständiger Integrationslauf.
- TypeScript, gezieltes ESLint und Produktionsbuild bestanden.
- Browser: ungültige Website abgewiesen, Eingabe erhalten; `www.example.com`
  als `https://www.example.com/` gespeichert; Österreich ausgewählt und nach Reload
  weiterhin als `AT` gespeichert. Website und Land anschließend im öffentlichen
  Pass sichtbar, interne Kontaktdaten dort nicht sichtbar. Abschließend Testprofil
  wieder auf Deutschland und leere Website gesetzt; Speichern erfolgreich.
- Beim ersten Rendern unterschieden sich lokalisierte Ländernamen zwischen Server
  und Browser. Behoben durch Übergabe der serverseitig erzeugten Liste an das Formular;
  anschließender Reload ohne sichtbaren Entwicklungsfehler.

Kevin bestätigt nach der Profilverbesserung und Entfernung des erklärenden
HTTPS-Hinweises ausdrücklich: „perfekt. dann push main und geb das gate frei“.
Damit ist das lokale Gate „MVP funktional vollständig“ freigegeben. Die automatisierte
Website-Erkennung mit und ohne HTTP(S) bleibt trotz entferntem Hinweis erhalten.
Die abschließende reine Textentfernung wurde im Browser und mit `git diff --check`
geprüft; die übrigen aktuellen Nachweise stehen oben.

Der zweite Browserhelfer wurde regulär beendet. Abschließende lesende Kontrolle
der isolierten Instanz: 0 synthetische Testkonten, 0 Produkte, 0 Dokumente,
0 Dateivorgänge und 0 Storage-Objekte im Produktbucket. Testvolumes und reservierte
öffentliche IDs bleiben erhalten. Keine produktive Datenbankmigration oder Bereitstellung.
