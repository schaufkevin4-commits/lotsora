# Verbindliche Restpunkte bis zur Gate-Freigabe

Datum: 20.09.2026. Prüfstand der zwei unabhängigen Prüfungen (Claude, Codex):
`bbf80930a778d2ee46e9c76e94e2f89a74105a3d` (`main`). Umsetzung auf dem neuen Branch
`codex/gate-restpunkte`, ausgehend von diesem Stand.

**Status: Lokales Gate durch Kevin am 20.09.2026 nach Browserabnahme freigegeben.**
P1-1 bis P1-5 sind technisch umgesetzt und sämtliche geforderten automatisierten
Prüfungen bestanden. Kevins ausdrückliche Abnahme einschließlich Profilverbesserung liegt vor.
Die anschließende [lokale Browserprüfung](GATE-BROWSERABNAHME-2026-09-20.md)
ist technisch abgeschlossen; ihr Protokoll trennt beobachtete Ergebnisse von
noch ausstehenden manuellen Nachweisen. Kevin hat Gate-Freigabe und Push nach main
nach der gemeinsamen Browserabnahme ausdrücklich beauftragt. Die Freigabe gilt lokal;
P2/P3 bleiben vor Kundeneinsatz beziehungsweise Cloud-Livegang erforderlich.
Die anschließend ausdrücklich beauftragte Profilverbesserung ist umgesetzt und
im Browser sowie mit gezielten Unit-/Action-Tests und Produktionsbuild geprüft;
Details und aktuelle zusätzliche Nachweise stehen im Browserprotokoll.
Diese Datei ist die eine gültige Restpunkteliste bis zur Gate-Freigabe. Frühere Listen,
Testzahlen und Einschätzungen in README und Abschlussberichten sind historisch.
Insbesondere bleibt die echte Screenreader-Stichprobe gemäß dem neuen Arbeitsauftrag
offen; die frühere gebündelte Nutzerbestätigung wird dafür nicht als abschließender Nachweis übernommen.

Ursprünglicher Umsetzungsumfang (vor der anschließenden Browserabnahme): nur P1-1 bis P1-5 umsetzen. P2/P3 nur dokumentieren. Keine Entscheidung von Kevin
zu diesen späteren Punkten vorwegnehmen. Kein Push nach main, kein Cloud-Rollout, kein
Deployment, kein `supabase db push`, kein Reset. Bestehende Migrationen unverändert;
die neue Migration gilt ausschließlich für `lotsora-integration` (API-Port 55321).
Die im Auftrag ausgenommenen Brain-KI-Dateien werden nicht geändert.

## Verbindliche Liste

Belege ohne Commitangabe beziehen sich auf diesen Branch. `T` steht für
`supabase/migrations/20260920120000_firmenteams.sql` (unverändert).

| ID | Titel | Priorität | Termin | Status | Beleg (Datei:Zeile) |
|---|---|---|---|---|---|
| P1-1 | Direkte Storage-Löschung angehängter Dateien sperren (N1) | P1 | vor lokalem Gate | Umgesetzt; Vorher rot / Nachher grün | `supabase/migrations/20260920180000_gate_restpunkte.sql:5`; `tests/integration/storage-delete-policy.test.ts:10` |
| P1-2 | Website-Adresse vor linkerzeugenden Mutationen validieren (A4) | P1 | vor lokalem Gate | Umgesetzt; Unit-/Action-Tests grün | `lib/site-url.ts:9`; `app/(intern)/team/actions.ts:16`; `tests/integration/gate-actions.test.ts:76` |
| P1-3 | Direkte Action-Tests für Teamkette und Versionskonflikt (A3) | P1 | vor lokalem Gate | Umgesetzt; 11 gezielte Integrationstests grün | `tests/integration/gate-actions.test.ts:67` |
| P1-4 | Fehlende/fremde Löschziele verständlich melden (A6) | P1 | vor lokalem Gate | Umgesetzt; Service-/Action- und Cleanup-Tests grün | `lib/services/products.ts:277`; `lib/services/documents.ts:180`; `tests/integration/gate-actions.test.ts:158` |
| P1-5 | Tote Firmen-Policies entfernen; Widerrufszeitpunkt erhalten (A5/A7a) | P1 | vor lokalem Gate | Umgesetzt; Katalog-/Action-Tests grün | `supabase/migrations/20260920180000_gate_restpunkte.sql:8`; `tests/integration/gate-actions.test.ts:89,184` |
| P2-1 | Konto-/Firmenlöschung für alleinigen Verantwortlichen (A1) | P2 | vor erstem Kunden | Offen; Entscheidung Kevin | `T:13–18,41,174,187–190`; `tests/integration/fixtures.ts:50–55` |
| P2-2 | Weg für mitgliedschaftslose Konten (A2) | P2 | vor erstem Kunden | Offen; Entscheidung Kevin | `app/(intern)/layout.tsx:34`; `T:54–66`; `tests/integration/teams.test.ts:128–129` |
| P2-3 | Reichweite des Versionsschutzes (A7b/N2) | P2 | vor erstem Kunden | Offen; Entscheidung Kevin | `supabase/migrations/20260916120000_editor_konfliktschutz.sql:41–82` |
| P2-4 | Getrennte Veröffentlichungsstände (D5) | P2 | vor erstem Kunden | Offen; Produktentscheidung Kevin | `lib/editor-save.ts:29`; `app/(intern)/produkte/[id]/VeroeffentlichenAbschnitt.tsx:41,57` |
| P2-5 | Physischer QR-Druckscan und echte Screenreader-Stichprobe | P2 | vor erstem Kunden | Offen; manuelle Nachweise fehlen | `docs/N8-RESTABNAHME-2026-09-20.md:7–19`; neuer Arbeitsauftrag, Teil 3 |
| P3-1 | Voll-Apply auf garantiert leere Instanz (C2) | P3 | vor Cloud-Livegang | Offen; jetzt ausdrücklich nicht ausgeführt | `scripts/integration.mjs:78–87,129–131` |
| P3-2 | CSP, Framing-Schutz und HSTS (C3) | P3 | vor Cloud-Livegang | Offen; Hostingkonfiguration festlegen | `next.config.ts:3–10`; `app/auth/confirm/route.ts:19–20` |
| P3-3 | Einladungstoken aus Hostinglogs heraushalten (B2) | P3 | vor Cloud-Livegang | Offen; tatsächliche Logs prüfen | `app/einladung/[token]/page.tsx:8`; `T:121–123` |
| P3-4 | Cookieübernahme auf Login-Redirect (N3) | P3 | vor Cloud-Livegang | Optional; zurückgestellt | `lib/supabase/middleware.ts:17–22,35–38` |
| P3-5 | Wiederherstellung, Monitoring und Betriebsgrundlagen | P3 | vor Cloud-Livegang | Offen; kein Hosting-/Betriebsnachweis | `README.md`, Abschnitt Lokal entwickeln; neuer Arbeitsauftrag, Teil 3 |
| B1 | Möglicher Sperrkonflikt mit Auth-Dienst | P3 | vor Cloud-Livegang | Unbewiesener Verdacht; keine Änderung | `T:137–140` |

## Auslöser, Wirkung, Korrektur und Nachweis

**P1-1:** Ein Firmenmitglied konnte über `storage.remove` angehängte Dateien löschen,
ohne Dokumentverweis oder Zustand `attached` zu entfernen. Ursache war die permissive
Policy `Dok-Datei: eigene loeschen` aus `20260825163947_dokumente_storage.sql:37–42`.
Die neue Migration entfernt nur diese alte Erlaubnis; die bestehende Cleanup-Policy
und Zustandsmaschine bleiben erhalten. Der neue Test versucht die direkte Löschung
als Mitarbeiter und Verantwortlicher, prüft Datei, Dokument und Zustand und führt
anschließend Dokumentlöschung, `cleanup` und `bereinigeDatei` bis `deleted` aus.
Vorher-/Nachher-Nachweis siehe Prüfprotokoll. Die vier im Auftrag genannten Testhelfer
verwenden für Testabbau beziehungsweise absichtliche Dateibeschädigung nun `verifier`.
Reguläre Fach- und Berechtigungsprüfungen verwenden weiterhin Nutzer-Clients.
Zusätzlich zeigte die erste volle Suite eine fünfte solche Stelle in
`tests/integration/uploads.test.ts:83`: Der Test simuliert Dateiverlust nach Validierung.
Er prüft jetzt zuerst die verweigerte Nutzerlöschung samt weiterhin lesbarer Datei
und simuliert erst danach den externen Verlust mit `verifier`; Uploads und
Abschlussversuche nach diesem Verlust bleiben mit dem Nutzer-Client geprüft.

**P1-2:** Fehlende oder unbrauchbare `NEXT_PUBLIC_SITE_URL` konnte kaputte Links erzeugen
und beim erneuten Einladen zuvor einen gültigen Link widerrufen. `getSiteUrl()` verlangt
einen absoluten HTTP(S)-Ursprung ohne Zugangsdaten, Unterpfad, Query oder Fragment,
normalisiert den abschließenden Schrägstrich und wirft sonst `SiteUrlFehler`.
Die App unterstützt hier keine Installation unter einem Unterpfad. Alle vier Aufrufstellen
prüfen vor der linkerzeugenden Mutation und geben eine verständliche Meldung zurück.
Nachweis: 18 Unit-Fälle, Action-Test mit weiter nutzbarem altem Link und unverändertem
Einladungseintrag sowie Konfigurationsfehler-Tests für Registrierung, Reset und Teamregistrierung.

**P1-3:** Bisher waren DB-/Servicewege automatisiert geprüft, aber nicht die Team-Actions
mit FormData und Rückgabeverhalten. Die neue Suite ruft die tatsächlichen Actions direkt
auf; ausschließlich Next-Cookies und Cache werden ersetzt. Auth, RPCs, RLS und Services
laufen gegen die echte isolierte Instanz. Abgedeckt sind Einladen/Verweigerung für
Mitarbeiter, bestätigter Widerruf, ID-Prüfung/Entfernung, Übergabe/Rechteentzug,
falsches/richtiges Beitrittskonto sowie ein veralteter Save. Beim Save bleiben FormData
unverändert und bestätigte Daten erhalten; die Action gibt `conflict: true` zurück.
Die tatsächliche Next-Redirect-Ausnahme wird für den Beitritt geprüft. Dies ist keine
Browser-POST-/Flight-/CSRF-Abdeckung und behauptet keine vollständige Abdeckung aller
neun Action-Dateien. Bestehende Editor-Unit-Tests prüfen ergänzend den Konfliktzustand.

**P1-4:** RLS kann eine DELETE-Anfrage ohne Fehler mit null betroffenen Zeilen beenden.
Die Services hängen jetzt `.select("id")` an und werfen bei leerem Ergebnis einen
`LoeschzielFehler`; beide Actions zeigen „nicht gefunden oder kein Zugriff“ und melden
keinen Erfolg. Tests prüfen fremde und zufällige fehlende IDs in Services und Actions
und die Unversehrtheit fremder Datensätze. Eine erneute Löschung desselben bereits
entfernten Datensatzes ist damit bewusst kein Erfolg mehr. Offene Storage-Bereinigung
läuft weiterhin über `bereinigeDatei` / `bereinigeProduktdateien` und die vorhandene
UI für offene Dateivorgänge. Die bisherigen Ausfall-/Wiederholungstests wurden auf
diesen Pfad umgestellt; ihre Nachweise für Aufträge, Antwortverlust und Wiederaufnahme
bleiben erhalten. Gemeinsame Dateiverweise und atomarer Rollback werden weiter geprüft.

**P1-5:** Nach einem künftigen Pauschal-Grant hätten die alten Hersteller-Policies wieder
gewirkt. Die neue Migration entfernt beide; die gezielte Katalogabfrage bestätigt ihre
Abwesenheit. Wiederholter Widerruf konnte den ursprünglichen Zeitstempel überschreiben.
`CREATE OR REPLACE` ergänzt `revoked_at is null`, behält Signatur und bestehende ACLs
und meldet danach eine nicht mehr offene Einladung. Der Action-Test prüft Bestätigung,
ersten Widerruf, abgewiesene Wiederholung, unveränderten Zeitpunkt und gesperrten Beitritt.
Tabellen-/RPC-Signaturen ändern sich nicht; eine Typenneuerzeugung ist nicht nötig.

**P2-1:** Ein alleiniger Firmenverantwortlicher kann weder Verantwortung übergeben noch
sein Konto oder seine Firma im vorgesehenen Produktablauf löschen. Erfolgreiche
Mitarbeiterlöschung und rohe SQL-Testbereinigung lösen diesen Normalfall eines
KMU-Erstkunden nicht. Kevin muss zwischen Selbstbedienung und dokumentiertem
Betreiberprozess entscheiden. Bei Selbstbedienung ist ein autorisierter atomarer
Firmenlöschablauf einschließlich Dateiaufträgen zu entwerfen; `private.product_public_ids`
muss dauerhaft bestehen bleiben. Kein solcher Ablauf wurde jetzt implementiert.
Nachweis vor Kunde: alleiniger Verantwortlicher, gemeinsame Daten, Dateibereinigung,
fehlende Fremdrechte und dauerhaft nicht recycelbare QR-IDs.

**P2-2:** Ein entferntes Mitglied besitzt weiter sein Konto, kann aber selbst keine
Firma gründen. Eine neue Einladung ermöglicht den Beitritt; die E-Mail ist nicht
verloren. Entscheidung Kevin: „Eigene Firma anlegen“ oder klarer Supportweg.
Nachweis: entferntes Konto erhält ohne technische Handarbeit des Kunden einen
erklärten Weg zurück; eine erneute Einladung funktioniert bereits im Teamtest.

**P2-3:** Ältere Speicher-/Veröffentlichungs-RPCs und direkte Tabellenupdates verlangen
keine erwartete Editorversion. Die aktuelle Editoroberfläche nutzt die geprüften RPCs;
API-Clients können jedoch ohne Versionsvergleich schreiben. Kevin muss entscheiden,
ob dieser Schutz für alle API-Schreibwege zwingend sein soll. Kein bloßer Rechteentzug:
die geprüften Wrapper laufen als `SECURITY INVOKER` und benötigen die aufgerufenen
Funktionen selbst. Jetzt unverändert. Nach Entscheidung alle direkten und indirekten
Schreibwege mit konkurrierenden, veralteten Ständen prüfen.

**P2-4:** Gespeicherte Änderungen veröffentlichter Produkte sind sofort öffentlich;
1.200 ms ist der Autosave-Debounce, kein fester periodischer Speicherzyklus. Die UI
weist darauf hin. Dies ist ein Produktrisiko, kein nachgewiesener Codefehler.
Kevin entscheidet über Beibehaltung oder getrennte Entwurfs-/Veröffentlichungsstände.
Nachweis: verständlicher Ablauf und genau der beschlossene öffentliche Datenstand.

**P2-5:** Bildschirm-/Dateidekodierung belegt keinen gedruckten QR-Code. Vor Kunde
Etikettengröße festlegen, physisch drucken und mit dem Handy prüfen. Außerdem echte
Sprachausgabe an relevanten Formularen, Dialogen und QR-Menü separat nachvollziehbar
prüfen. Der neue Auftrag führt diese Nachweise ausdrücklich offen; alte Sammelbestätigungen
bleiben als historische Quelle erhalten, ersetzen diese Stichprobe aber nicht.

**P3-1:** Inkrementeller Apply auf erhaltenen Testvolumes beweist keinen vollständigen
Neuaufbau. Vor Cloud-Livegang eine gesonderte garantiert leere Instanz und deren
vollständige Migrationskette mit konkreter Anzahl protokollieren. Jetzt kein Reset,
keine neue leere Instanz und kein behaupteter Voll-Apply-Nachweis.

**P3-2:** CSP, Framing-Schutz und HSTS fehlen in der App-Konfiguration; einzelne
Sicherheitsheader existieren bereits in der Auth-Route. Für den tatsächlichen
HTTPS-Host passende Header festlegen und Antwortheader sowie funktionierende
Auth-/Uploadabläufe prüfen. Jetzt keine Hostingänderung.

**P3-3:** Einladungstoken stehen im URL-Pfad. `no-referrer` entfernt sie nicht aus
Hostinglogs. Zwei UUIDv4 bieten 244 zufällige Bits; zusätzlich ist die passende
bestätigte E-Mail erforderlich. Vor Cloudbetrieb Zugriffspfade in Logs ausblenden
beziehungsweise redigieren und dies an den tatsächlichen Proxy-/Hostinglogs prüfen.
Eine konkrete Protokollierung beim späteren Host ist bisher nicht nachgewiesen.

**P3-4:** Der Login-Redirect erzeugt eine neue Response und übernimmt zuvor gesetzte
Cookies nicht. Nach Schiedsentscheidung optional P3, kein Gate-Blocker; allenfalls
zusätzlicher Refresh nach verlorenem Cookie-Clear, kein belegter Auth-Bypass oder
Redirect-Loop. Keine Änderung. Wenn später umgesetzt, nur additiv mit einem Test,
der den konkreten Cookie-Clear-/Redirect-Fall tatsächlich auslöst.

**P3-5:** Cloudbetrieb benötigt gesicherte Betriebsgrundlagen: Backup samt geprobter
Wiederherstellung, Monitoring, Betreiberangaben, Datenschutzerklärung, Domain und
HTTPS. Vor Livegang verantwortliche Abläufe festlegen und konkrete Betriebsnachweise
erheben; ein erfolgreicher lokaler Build ersetzt das nicht.

**B1:** Die Sperre auf `auth.users` kann konkurrierende Operationen warten lassen.
Ein Deadlock mit GoTrue ist nicht nachgewiesen. Keine Sperränderung, solange kein
konkreter Sperrzyklus belegt ist; `FOR SHARE` ist keine belegte Reparatur und muss
die Serialisierung gleichzeitiger Beitritte erhalten.

## Strittig und entschieden

Die Schiedsentscheidungen aus Kevins übergebenem Arbeitsauftrag gelten; sie werden
nicht durch neue technische Freigabeentscheidungen ersetzt.

- **A5:** Claude korrigiert „jeder Mitarbeiter“ zu „Verantwortlicher“
  (`auth.uid() = user_id`). Niedrige ursprüngliche Schwere, Aufräumen jetzt P1-5.
- **A2:** Claude nimmt „E-Mail für immer verbrannt“ zurück. Wiederbeitritt per neuer
  Einladung ist geprüft; fehlender Selbstbedienungsweg ist ein Supportfall.
- **C3:** Claude nimmt „keine Sicherheitsheader“ zurück. Es fehlen CSP,
  X-Frame-Options und HSTS in `next.config.ts`; die Auth-Route setzt bereits
  `Cache-Control` und `Referrer-Policy`.
- **A4:** Der alte Link wird widerrufen; die neue Einladung bleibt offen, ihr
  angezeigter Link ist bei Fehlkonfiguration kaputt. Nicht „neue Einladung verbraucht“.
- **N1:** Von Claude zunächst übersehen, nun bestätigt; sofortige Korrektur P1-1.
- **A1:** Codex' Hinweis auf Mitarbeiterlöschung und SQL-Testabbau reicht für den
  alleinigen Verantwortlichen nicht aus. Vor erstem Kunden zwingend, kein lokaler
  Gate-Blocker. Keine Aussage, dass ein fehlender Button allein Rechtswidrigkeit beweist.
- **N3:** Kontrollfluss bestätigt, automatische Hochstufung zurückgewiesen. Laut
  Schiedsentscheidung entspricht er dem Supabase-Muster; keine erneute SDK-Analyse
  oder Änderung in diesem Auftrag. Optional P3, kein Gate-Punkt.
- **B1:** Verdachtsfall ohne belegten Sperrzyklus. Unverändert lassen.

Weitere Zuordnung der Doppelprüfung: A3 → P1-3, A6 → P1-4,
A7a → P1-5, A7b/N2 → P2-3, B2 → P3-3, C1 → frische Testnachweise unten,
C2 → P3-1, D5 → P2-4. D1 (Mandantenzuordnung), D2 (anonyme Spaltengrenzen),
D3 (nur Service-Role validiert Dateien) und D4 (Tokenhash/Spaltengrenzen) bleiben
bestätigte Prüfresultate ohne zusätzliche offene Implementierungsaufgabe.

## Prüfprotokoll dieser Umsetzung

- Neue additive Migration: `20260920180000_gate_restpunkte.sql`; insgesamt **23**.
  Start mit den bisherigen 22 Migrationen, anschließend `test:integration:migrate`
  ausschließlich gegen `lotsora-integration`. Kein Reset, keine Cloudmigration.
  Lesende Katalogkontrolle bestätigt `23|20260920180000`; als Storage-DELETE-Policy
  verbleibt ausschließlich `Dok-Datei: eigenen Loeschvorgang ausfuehren`.
- Zeitangaben dieses Protokolls: lokale Testrechnerzeit, Europe/Berlin (UTC+02:00).
- **Vorher rot**, 20.09.2026 17:40:12: neuer `storage-delete-policy.test.ts`
  gegen alten DB-Stand, ein Test fehlgeschlagen. Exakter Kern:
  `expected [ { …(11) } ] to have a length of +0 but got 1` an Zeile 24.
  Der Mitarbeiter konnte tatsächlich eine angehängte Datei direkt löschen.
- **Nachher grün**, 17:44:22: derselbe Storage-Test nach Migration zusammen
  mit `deletion.test.ts`: **18 Tests in 2 Dateien bestanden**, Exitcode 0.
  Kein Zurückdrehen/Reset der Migration zur Demonstration erforderlich.
- Gezielte Action-Suite, 17:46:49: **11 Tests bestanden**, Exitcode 0.
- `npm test`, 17:46:44: **131 Tests in 11 Dateien bestanden**, Exitcode 0.
- `npx eslint`: bestanden, Exitcode 0.
- `npx next typegen` und `npx tsc --noEmit`: bestanden, Exitcode 0.
- Erster vollständiger Integrationslauf, 17:47:18: **107 bestanden, 1 fehlgeschlagen,
  12 übersprungen**. Ursache war der fünfte, oben genannte Testaufbau in `uploads.test.ts`;
  wegen blockierter Nutzerlöschung fehlte die Datei tatsächlich nicht mehr, sodass
  der anschließend erwartete Abschlussfehler ausblieb. Testaufbau korrigiert,
  produktive Berechtigungen nicht wieder gelockert.
- Vollständiger Wiederholungslauf `npm run test:integration`, 17:51:47:
  **108 bestanden, 12 übersprungen** (12 bestandene / 2 übersprungene Dateien),
  Exitcode 0. Die 12 übersprungenen Fälle sind 11 separat aktivierte HTTP-Tests
  und der manuelle Browserhelfer; sie werden nicht als bestandene Tests gezählt.
- `npm run build`: bestanden, Exitcode 0, Next 16.3.5 mit registriertem Proxy.
- Lint und `tsc --noEmit` nach Anpassung des fünften Testaufbaus erneut bestanden.
- `node scripts/integration.mjs http`, 17:53:20: eigener Produktionsbuild bestanden,
  danach **11 HTTP-Tests in 1 Datei bestanden**, Exitcode 0. Auth-Mails, öffentliche
  Pass-/Dateirouten, Zugriffsgrenzen und Fehlerfälle wurden damit neu geprüft.
- Abschließende lesende DB-Kontrolle: **0 synthetische Testkonten, 0 Produkte,
  0 Dokumente, 0 Storage-Objekte im Produktbucket und 0 Dateivorgänge**.
  Anschließend `test:integration:stop` erfolgreich; Testvolumes und reservierte
  öffentliche IDs bleiben erhalten. Entwicklungsprojekt und Cloud unverändert.

Alle geforderten automatisierten Prüfungen sind grün. Kein offener technischer
P1-Punkt. Neue Migration nur lokal in der isolierten Testinstanz angewendet;
kein Push nach main und keine Gate-Freigabe. P2/P3 und B1 bleiben wie beauftragt
unimplementiert beziehungsweise unverändert. Die Schiedsentscheidungen wurden
übernommen; kein ihnen widersprechender Codebeleg erforderte einen Arbeitsstopp.

## Nicht ausgeführte Prüfungen

- Voll-Apply auf eine garantiert leere Datenbank.
- Physischer QR-Druckscan mit festgelegter Etikettengröße.
- Echte, separat nachvollziehbare Screenreader-Stichprobe.
- Cloud-Prüfungen: produktive Rechte, Auth-URLs/Mailversand, Hostingheader,
  Tokenlogs, Domain/HTTPS und Betriebs-/Wiederherstellungsnachweise.

Die gezielten Action-Tests ersetzen keine manuelle Abnahme. Der anschließende
Browserdurchlauf und Kevins ausdrückliche lokale Gate-Freigabe sind im
[Abnahmeprotokoll](GATE-BROWSERABNAHME-2026-09-20.md) dokumentiert.
