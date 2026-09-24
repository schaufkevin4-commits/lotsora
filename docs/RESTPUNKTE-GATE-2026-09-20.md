# Verbindliche Restpunkte bis zur Gate-Freigabe

**Aktueller Einstieg 24.09.2026:** Tag 28 auf Kevins Auftrag gestartet: sechs synthetische Textilprodukte, zwei Firmen, sechs Rollen und 26 Szenarien mit Soll-Ergebnissen vorbereitet. [Testplan und Nachweis](TAG-28-TESTVORBEREITUNG-2026-09-24.md). 13 gezielte Katalogprüfungen bestanden; Katalog nicht eingespielt, Ablaufprüfungen und Quiz offen, formal 27/40. Reihenfolge: Tag 28 → Tag 29 Stabilisierung/Regression/CI → gemeinsam abgestimmtes professionelles Design → erneute UI-Regression und echte QR-/Screenreader-Nachweise → Tag 30 und ausdrückliches Gate. Gezeigter Grundaufbau funktioniert laut Kevin; Beispiel 1 ist eine vorläufige Präferenz, keine finale Designfreigabe. Produkt-/UI-Code unverändert. Dieser lokale Dokumentationsstand wird nicht nach Lotsora-main gepusht oder deployt. **Ältere Einstiegsangaben unten sind historisch.**

**Tagesabschluss 22.09., nachgetragen am 23.09.2026:** Kevin hat die Übernahme und den Push des geprüften Stands nach main beauftragt. [Abschluss, Nachweise und Wiedereinstieg](TAGESABSCHLUSS-2026-09-22.md). Die sieben lokalen Arbeitscommits einschließlich P2-2/P2-3/P2-4 und gemeinsamer P2-6-Struktur werden damit gesichert; ältere Hinweise „kein Push“ unten beschreiben den Stand vor diesem Auftrag. Testreste bereinigt und isolierte Testinstanz gestoppt, kein DB-Reset/Cloud-Apply. Kevin arbeitet vorübergehend am Brain-KI-Cockpit weiter. Nächster Lotsora-Einstieg: Gesamtaufbau beurteilen, danach finale Gestaltung. Nutzer-/Kundenabnahmen und Tag 28 bleiben offen.


**Einordnung 22.09.2026:** [LP-002-Abgleich und Zuordnung zu Phase 6](UEBERGABE-NACH-GATE-2026-09-20.md#lp-002-abgleich-am-22092026). Die aktuellen Tabellenstatus gelten; ältere Problembeschreibungen unten sind historisch. P2-1 bis P2-3 sind nach den bestätigten Fortsetzungen abgenommen. P2-4 ist jetzt vor Kundentest im vollständigen Passumfang lokal umgesetzt und technisch/live geprüft; Nutzerabnahme des neuen Stands offen. [Nachweis](P2-4-UMSETZUNG-2026-09-22.md). P2-6-Struktur inzwischen über die Seitenfamilien umgesetzt; Nutzerbeurteilung und finale Optik offen.

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
| P2-1 | Konto-/Firmenlöschung für alleinigen Verantwortlichen (A1) | P2 | vor erstem Kunden | Umgesetzt, geprüft und nach Live-Vorführung durch Kevin abgenommen; Sicherung auf main beauftragt | `P2-1-UMSETZUNG-2026-09-20.md`; Cloud-Betrieb bleibt P3 |
| P2-2 | Weg für mitgliedschaftslose Konten (A2) | P2 | vor erstem Kunden | Lokal umgesetzt, geprüft und nach Browservorführung/Fortsetzungsbestätigung abgenommen | [Umsetzung und Prüfungen](P2-2-UMSETZUNG-2026-09-22.md); `app/firma/neu`; `20260922120000_firma_neuanlage.sql` |
| P2-3 | Reichweite des Versionsschutzes (A7b/N2) | P2 | vor erstem Kunden | Voller Formular-/Statusumfang lokal umgesetzt, technisch/live geprüft und durch bestätigte Fortsetzung angenommen | [Umsetzung und Nachweise](P2-3-UMSETZUNG-2026-09-22.md) |
| P2-4 | Getrennte Veröffentlichungsstände (D5) | P2 | vor erstem Kunden | Vollständiger Passumfang lokal umgesetzt, technisch/live geprüft; separate Nutzerabnahme offen | [Umsetzung und Nachweise](P2-4-UMSETZUNG-2026-09-22.md) |
| P2-5 | Physischer QR-Druckscan und echte Screenreader-Stichprobe | P2 | vor erstem Kunden | Offen; manuelle Nachweise fehlen | `docs/N8-RESTABNAHME-2026-09-20.md:7–19`; neuer Arbeitsauftrag, Teil 3 |
| P2-6 | Struktur und später finales Erscheinungsbild des Frontends | P2 | vor erstem Kundentest | Gemeinsame Struktur auf Seitenfamilien übertragen und geprüft; Nutzerbeurteilung und finale Optik offen | [Seitenumfang, Wettbewerb und Prüfungen](P2-6-SEITEN-UND-WETTBEWERB-2026-09-22.md) |
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

**P2-1 – historische Problembeschreibung vor der inzwischen abgenommenen Umsetzung:**
Aktueller Stand und Nachweise: [P2-1-UMSETZUNG-2026-09-20.md](P2-1-UMSETZUNG-2026-09-20.md).
Ein alleiniger Firmenverantwortlicher kann weder Verantwortung übergeben noch
sein Konto oder seine Firma im vorgesehenen Produktablauf löschen. Erfolgreiche
Mitarbeiterlöschung und rohe SQL-Testbereinigung lösen diesen Normalfall eines
KMU-Erstkunden nicht. Kevin muss zwischen Selbstbedienung und dokumentiertem
Betreiberprozess entscheiden. Bei Selbstbedienung ist ein autorisierter atomarer
Firmenlöschablauf einschließlich Dateiaufträgen zu entwerfen; `private.product_public_ids`
muss dauerhaft bestehen bleiben. Kein solcher Ablauf wurde jetzt implementiert.
Nachweis vor Kunde: alleiniger Verantwortlicher, gemeinsame Daten, Dateibereinigung,
fehlende Fremdrechte und dauerhaft nicht recycelbare QR-IDs.

**P2-2:** Kevin hat am 22.09. die Selbstbedienung mit zwei verständlichen Wegen
beauftragt. Entfernte Mitglieder oder erhaltene Konten nach Firmenlöschung können
bewusst einen neuen leeren Firmenbereich anlegen; Einladung zur bestehenden Firma
bleibt der zweite Weg. Mitgliedschaft, Bestätigung und Löschstatus werden in der
DB geprüft; wiederholte Anfragen erzeugen keine zweite Firma. [Umsetzung und 13
neue Integrationsfälle](P2-2-UMSETZUNG-2026-09-22.md). Technisch geprüft und live
vorgeführt; abschließende Nutzerabnahme nicht vorweggenommen.

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
Durch A4 ist die Trennung von Entwurfs-/Veröffentlichungsständen bereits als Richtung
beschlossen, spätestens vor kontrollierten Importen. Kevin entscheidet noch über
die Vorziehung vor den ersten Kunden und den konkreten Umfang; die grundlegende
Richtung wird nicht erneut zur Wahl gestellt.
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

## Neue Phase: Bestandsprüfung am 20.09.2026

Diese Ergänzung dokumentiert die erneute Bestandsprüfung und die ursprüngliche
Vorlage für P2-1. Kevins anschließende Wahl und die inzwischen bestätigte Kontenabgrenzung
stehen am Anfang des P2-1-Abschnitts. Keine neue PP-Entscheidungsnummer, keine Änderung
der abgeschlossenen Gate-Abnahme und keine Umsetzung des Löschablaufs.

### Tatsächlich erneut gelesener Stand

- Lotsora-GitHub-`main`: `5bebdb6336ce21e1474fc34ec1224daf242b54a3`, über den
  GitHub-Connector frisch abgefragt; keine neueren main-Änderungen.
- Lokales main unter `C:/Users/kevin/OneDrive/Documents/ChatGPT/Lotsora` und
  Arbeitskopie unter `C:/Users/kevin/Documents/Codex/2026-09-14/starte/work/lotsora-b4`
  standen vor dieser Dokumentation sauber auf demselben Commit. Letztere ist
  weiterhin auf `codex/gate-restpunkte`; ihr Inhalt war identisch zu main.
- Geltende `AGENTS.md` gelesen: vor Codearbeit relevante Next-Guides aus der
  installierten Version lesen. Keine untergeordneten AGENTS-Dateien gefunden.
  README, Übergabe, diese Restpunkteliste, Browserabnahme und Architekturbeschluss
  vollständig gelesen; zusätzlich relevante Produktvision/Planung, Migrationen,
  Services und Teamtests untersucht.
- Brain-KI über GitHub zugänglich: aktuelles `main`
  `0439b2c56b296e6951f0c5f5234d4bf918dcf273`. Erneut gelesen: README,
  System/MASTER, BRAIN_REGELN (v4.1), DATEI_ZUORDNUNG und CLOUD;
  System/ENTSCHEIDUNGEN, relevante Abschnitte aus System/AKTUELL,
  PassPilot/ENTSCHEIDUNGEN (insbesondere PP-013, PP-016/E6, PP-017, PP-018–022),
  STAND, TECHNIK, MVP, DATENMODELL und ROADMAP sowie LP-002/PLAN und relevante
  KI_Lernen/LEARNINGS (kleiner Umfang bei klarer Logik, dauerhafte QR-Adressen,
  Datentrennung und Wireframe versus visuelle Gestaltung).
- Lokaler Brain `C:/Brain-KI`: sauber auf `5975954`; GitHub-Vergleich bestätigt
  **11 Commits hinter dem aktuellen main**, keine Divergenz. Nicht synchronisiert.
  Eine Brain-Root-AGENTS.md wurde über GitHub mit 404 beantwortet; lokal keine
  AGENTS.md gefunden. Das ist kein fehlender Zugriff auf die gelesenen Brain-Dateien.
- Keine neue Laufzeit-, Browser-, Datenbank- oder Cloud-Prüfung. Der dokumentierte
  Testdatenabbau und frühere grüne Testläufe bleiben historische Nachweise; die
  beendete Testumgebung wurde für diese Dokumentationsaufgabe nicht gestartet.

### Widersprüche, Einordnung und Grenzen

1. Brain `PassPilot/STAND.md`, `System/AKTUELL.md` und LP-002 beziehen sich noch
   auf ältere Lotsora-Stände und ein offenes lokales Gate. Die aktuelle
   Lotsora-Restpunkteliste und dokumentierte Freigabe vom 20.09. sind gemäß
   Kevins aktuellem Auftrag maßgeblich. Kein Wiederöffnen erledigter Gate-Punkte.
2. Brain PP-017/E5 und TECHNIK verschieben Firmenrollen; DATENMODELL führt
   Unternehmensaccounts/Benutzerrollen als später. Der neuere Lotsora-
   Architekturbeschluss zieht einfache Firmenzugänge ausdrücklich in V1 vor;
   sie sind umgesetzt und bleiben erhalten. Entsprechend ergänzt die aktuelle
   Teamnavigation den älteren Menüumfang aus PP-018/020. Komplexe Rollen/Mehrfirmenzugang
   werden daraus nicht abgeleitet. Brain-Dokumentationsdrift bleibt sichtbar.
3. P2-4 nennt eine offene Produktentscheidung. Der Architekturbeschluss A4 hat
   die Richtung zu getrennten Freigabeständen bereits angenommen, spätestens
   vor kontrollierten Importen. Offen zu entscheiden sind der vorgezogene
   Termin vor dem ersten Kunden und die konkrete Ausgestaltung; keine stille
   Rücknahme der beschlossenen Richtung. Heute ändern gespeicherte Werte
   weiterhin unmittelbar den veröffentlichten Pass.
4. Brain TECHNIK nennt noch Vorbereitungsphase/ungewählte Datenbank neben
   bereits beschlossenen Technologien; ROADMAP enthält historische Phasen.
   Das ist kein aktueller Befund über die implementierte Anwendung.
5. Brain-Regeln zu automatischem Sync, allgemeinem Reset-/Cloud-Workflow und
   Dokumentation in geschützten Dateien sind keine zusätzliche Erlaubnis:
   Kevins aktueller Auftrag untersagt hier automatische Brain-Synchronisierung,
   Änderungen an den benannten Ausnahmedateien sowie Reset/Cloud/Deployment.
   Alle Brain-Dateien bleiben unverändert. Die Vorlage steht in dieser bereits
   vorhandenen zulässigen Projektunterlage, nicht als beschlossene Entscheidung.
6. Die bisherigen Schiedsentscheidungen (insbesondere A1, N3 und B1) bleiben
   bestehen. Der fehlende Löschablauf wird als bekannter P2-1 bearbeitet, nicht
   als neuer Gate-Blocker oder als pauschales Rechtswidrigkeitsurteil.

## P2-1: Entscheidungsvorlage zur Konto- und Firmenlöschung

**Fortschreibung nach Kevins Antwort am 20.09.2026:** Kevin wählt ausdrücklich
volle Selbstbedienung statt des empfohlenen Betreiberprozesses. Bei Firmenlöschung
soll eine Abfrage zu allen zugehörigen Mitarbeitern erscheinen; sie sollen danach
keinen Zugriff mehr haben. Neutrale Hinweisseite bestätigt und weiterhin empfohlen;
die öffentlichen IDs bleiben dauerhaft reserviert. Für den Zeitpunkt übernimmt
Kevin die Empfehlung: Gelegenheit zur Datensicherung und bewusster Ausführungszeitpunkt,
keine automatisch vorgegebene Bedenkfrist. In der Selbstbedienung wird der Vorgang
vom Verantwortlichen selbst ausgelöst; kein Betreiber muss den Antrag freigeben.

**Anschließend freigegeben und umgesetzt:** Die Mitarbeiterabfrage erhält eine
explizite Ja/Nein-Auswahl: Ja löscht alle zugehörigen persönlichen Mitarbeiterkonten
endgültig, Nein erhält die Konten ohne Firmenzugehörigkeit und Firmenzugriff.
Das eigene Konto wird separat ausgewählt. Keine Vorauswahl und keine feste Wartefrist.
Aktueller Umsetzungs- und Prüfnachweis: [P2-1-UMSETZUNG-2026-09-20.md](P2-1-UMSETZUNG-2026-09-20.md).

Die folgenden Vergleiche und die Betreiberempfehlung bleiben als ursprüngliche
Vorlage erhalten; die obige Wahl ersetzt die empfohlene Variante. „Alleiniger
Firmenverantwortlicher“ bedeutet nicht zwingend „einziges Teammitglied“:
Das Modell hat genau einen Verantwortlichen und kann weitere Mitarbeiter haben.

### Ausgangsstand der ursprünglichen Vorlage (vor Umsetzung)

Die Team-Migration sperrt das Löschen des verantwortlichen Auth-Kontos durch
`ON DELETE RESTRICT` und sichert dessen Mitgliedschaft. Eine Verantwortungsübergabe
an ein bestehendes Mitglied ist vorhanden. Normale Nutzer besitzen kein
Firmen-DELETE-Recht. Ein durchgängiger Konto-/Firmenlöschprozess ist nicht vorhanden.
Der privilegierte Fixture-Abbau ist ausschließlich ein Testhelfer und kein
Betreiberprozess (`20260920120000_firmenteams.sql`, `tests/integration/fixtures.ts`).

Produktdaten und Dokumente gehören der Firma, auch wenn ein Mitarbeiter sie
angelegt hat. Das Löschen eines Mitarbeiterkontos darf sie nicht entfernen.
Dateivorgänge erhalten Firmen-, Produkt-, Akteur- und Pfadbezüge über eine
Produktlöschung hinaus. Die aktuellen Cleanup-RPCs prüfen jedoch die noch
bestehende Mitgliedschaft: Nach Löschung der Firma wäre eine Bereinigung durch
normale Mitglieder nicht mehr möglich. Ein Abschlussprozess muss dies ausdrücklich
lösen; ein einfaches „Firma löschen, danach Konto löschen“ reicht nicht.

### Vergleich

| Gesichtspunkt | Selbstbedienung durch Verantwortlichen | Dokumentierter Betreiberprozess |
|---|---|---|
| Bedienung | Persönliches Konto und gesamte Firma als getrennte Aktionen; klare Folgenübersicht und erneute Identitätsbestätigung | Sichtbarer Kontakt-/Antragsweg; Betreiber prüft Identität, aktuelle Verantwortung, Umfang und ausdrückliche Bestätigung |
| Geschwindigkeit | Jederzeit selbst nutzbar; keine manuelle Wartezeit | Abhängig von erreichbarem Betreiber und vereinbartem Bearbeitungstermin |
| Aufwand vor erstem Kunden | Größer: sichere Oberfläche, Wiederanmeldung, dauerhafter Ablaufstatus, Fehlerfortsetzung und eigene Verwaltung bei Teilausfall | Kleiner bei wenigen Kunden, aber ebenfalls ein geprüftes technisches Verfahren mit Checkliste und Abschlussnachweis erforderlich |
| Hauptrisiko | Eine versehentliche Bestätigung kann den Bestand des gesamten Teams betreffen; Automatismus muss alle Fehlerfälle beherrschen | Falsche Firmenzuordnung, manuelle Fehler oder liegengebliebene Anträge; begrenzen durch exakte Zielprüfung, Vorschau und wiederholbare Ausführung |
| Dateibereinigung | Muss auch nach Abbruch, Logout und Verlust der Mitgliedschaft zuverlässig fortsetzbar sein | Betreiber muss dieselbe Fortsetzbarkeit unabhängig vom zu löschenden Konto haben |
| Späterer Ausbau | Weniger laufender Betreuungsaufwand bei wachsender Kundenzahl | Gut für den ersten Kunden; später denselben geprüften Ablauf hinter Selbstbedienung verwenden |

### Folgen für Konten, Team, Daten und öffentliche Pässe

| Gegenstand | Nur persönliches Konto löschen | Gesamte Firma löschen |
|---|---|---|
| Verantwortung | Solange die Firma bestehen soll, zuerst an ein bestehendes Mitglied übertragen; ist niemand vorhanden, Nachfolge einladen oder Firmenlöschung gesondert beauftragen | Die Firma wird ausdrücklich beendet; die Kontolöschung darf dies niemals still auslösen |
| Teammitglieder | Andere Konten und deren Firmenzugang bleiben erhalten | Alle Firmenmitgliedschaften und Einladungen enden; persönliche Mitarbeiterkonten bleiben standardmäßig bestehen und erhalten einen verständlichen Weg ohne Firma (P2-2) |
| Gemeinsame Produkte | Bleiben bei der Firma, unabhängig vom ursprünglichen Ersteller | Produkt- und Detaildaten der Firma werden entfernt, einschließlich Mitarbeiterbeiträgen |
| Dokumente und Bilder | Bleiben bei der Firma; Upload-/Akteurbezüge müssen bereinigbar bleiben | Interne und öffentliche Dokumente sowie Produktbilder müssen als Datensätze UND physische Storage-Dateien bereinigt werden |
| Offene Dateivorgänge | Andere berechtigte Mitglieder können bestehende firmenbezogene Vorgänge weiterführen | Alle Zustände berücksichtigen: angehängt, abgebrochener/laufender Upload und schon offene Bereinigung; Restfehler erhalten einen dauerhaften Auftrag |
| Öffentliche Produktpässe | Bleiben verfügbar, wenn die Firma sie weiter veröffentlicht | Empfehlung: Inhalte ab dem bestätigten Ausführungsbeginn zurücknehmen; QR-Adresse zeigt die neutrale Hinweisseite ohne Firmen-/Produktdaten |
| Öffentliche IDs | Unverändert | Reservierungen in `private.product_public_ids` bleiben dauerhaft; niemals löschen, wiederverwenden oder einem anderen Produkt zuordnen |

Ein dauerhaftes öffentliches Inhaltsarchiv nach Firmenlöschung wäre ein eigenes,
ausdrücklich zu beschließendes Betriebsmodell. Dauerhafte ID/URL bedeutet nicht,
dass sämtliche früheren Inhalte öffentlich gespeichert bleiben müssen.

Bestehende Dateilinks sind eine gesonderte Grenze: Der öffentliche Einstieg prüft
die aktuelle Freigabe und erzeugt im Code einen Link für 300 Sekunden; interne
Links verwenden standardmäßig 3.600 Sekunden (`public-files.ts`, `documents.ts`).
Bereits ausgegebene signierte Links können bis zu ihrem Ablauf bzw. wirksamer
Dateientfernung weiter nutzbar sein. Bereits heruntergeladene Dateien oder externe
Kopien lassen sich nicht zurückrufen. Keine Zusage einer weltweit sofortigen Löschung.

### Empfehlung für den ersten Kunden

**Zunächst Betreiberprozess mit sichtbarem Antragsweg und geprüftem technischem
Löschverfahren.** Das passt zum kleinen ersten Kundenkreis und ermöglicht eine
bewusste Prüfung gemeinsamer Daten und gedruckter QR-Codes. Die Empfehlung
begründet sich mit dem geringeren Umfang der ersten Umsetzung; ein manueller
Prozess ist nicht automatisch sicher. Eine reine Supportadresse oder eine lose
SQL-Anleitung erfüllt P2-1 nicht.

Vorgeschlagener Ablauf, erst nach Entscheidung umzusetzen:

1. Identität, aktuelle Firmenverantwortung und exakte Firma prüfen. Konto,
   Firmenbestand und gewünschte Kontolöschungen getrennt festhalten; keine
   pauschale Löschbefugnis über persönliche Mitarbeiterkonten.
2. Auswirkungen mit Anzahl Mitglieder, Produkte, veröffentlichter Pässe und
   Dateien anzeigen. Nachfolge oder Datensicherung anbieten; für den ersten
   Kunden bei Bedarf betreiberseitige Übergabe statt neuem Exportprodukt.
3. Teaminformation, Datensicherung und Ausführungstermin mit dem Verantwortlichen
   abstimmen; bis zum Beginn widerrufbar. Vor dem ersten unwiderruflichen Schritt
   Umfang bestätigen und Verantwortung/Bestand erneut prüfen.
4. Einen dauerhaften Löschvorgang beginnen: Änderungen, neue Uploads und
   Einladungsannahmen wirksam sperren; öffentliche Inhalte zurücknehmen.
   Sperre muss auch direkte API-Wege und bestehende Sitzungen erfassen.
5. Dateiinventar und fortsetzbare Aufträge sichern. DB- und Storage-Schritte
   kontrolliert ausführen; Bereinigung darf nicht von einer danach entfernten
   Mitgliedschaft abhängen. Storage-Dateien über die Storage-API entfernen,
   nicht nur Metadaten per SQL. Fehler bleiben sichtbar und wiederholbar.
6. Firmenbestand/Mitgliedschaften/Einladungen und gesondert beauftragtes Konto
   geordnet entfernen. Dauerhafte öffentliche ID-Reservierungen erhalten.
   Abschluss erst nach Kontrolle von Datenbestand, Storage und offenen Vorgängen;
   „öffentlich nicht verfügbar“ und „vollständig bereinigt“ getrennt melden.
7. Minimales Abschlussprotokoll ohne Zugangstoken/unnötige Inhalte führen.
   Personenbezüge und Dateinamen in technischen Vorgängen nicht unbegrenzt
   allein wegen der öffentlichen ID aufbewahren. Konkrete Fristen und nötige
   Ausnahmen sind noch nicht festgelegt. Backup-/Restore-Regeln im separaten
   P3-Paket müssen verhindern, dass erledigte Löschungen später still rückgängig
   werden; eine Live-Datenlöschung ist kein Nachweis gelöschter Sicherungskopien.

### Ursprüngliche Fragen an Kevin (inzwischen beantwortet)

1. Zunächst den empfohlenen Betreiberprozess oder bereits vollständige
   Selbstbedienung umsetzen?
2. Die Trennung bestätigen: persönliches Konto nach Übergabe löschbar;
   Firmenlöschung nur ausdrücklich, Mitarbeiterkonten bleiben erhalten und
   das Konto des Antragstellers wird nur auf eigenen Wunsch mitgelöscht?
3. Bei Firmenlöschung öffentliche Inhalte zurücknehmen und die dauerhaften
   QR-Adressen nur noch auf eine neutrale Hinweisseite führen, wie empfohlen;
   oder wird eine weitere öffentliche Bereitstellung der Inhalte benötigt?
4. Löschung nach abgestimmtem Termin und Gelegenheit zur Datensicherung
   ausführen, ohne automatische Wartefrist; oder wird eine feste Bedenkfrist
   gewünscht? Empfehlung: abgestimmter Termin, bei Bedarf betreiberseitige
   Datenübergabe vor Beginn; keine versprochene Wiederherstellung nach Beginn.
5. Falls Betreiberprozess: Über welchen tatsächlichen Kontaktweg soll der
   Antrag eingehen, und übernimmst du die Bearbeitung? Keine Supportadresse
   oder Bearbeitungsfrist erfinden.

### Abnahme nach der Entscheidung

Gezielt prüfen: alleiniger Nutzer; Verantwortlicher mit Mitarbeitern; Übergabe
ohne Datenverlust; abgewiesener Antrag durch Mitarbeiter/fremde Firma; widerrufene
Berechtigung; alte Sitzungen; paralleler Save/Upload/Beitritt; Unterbrechung und
Wiederholung; fehlende Datei/Storage-Ausfall; verbliebene offene Dateivorgänge;
unveränderter Fremdmandant; nicht mehr erreichbare öffentliche Inhalte und Dateien;
erhaltene ID-Reservierungen. Zusätzlich den gewählten Antrags-/Bestätigungsablauf
im Browser zeigen. Dies war der Prüfplan vor Umsetzung; die tatsächlich ausgeführten
Prüfungen sind im separaten Umsetzungsnachweis aufgeführt.

Dokumentationsstand: 20.09.2026. P2-1 ist lokal umgesetzt und geprüft; Cloud-Betrieb
und Rollout sind nicht erfolgt. P2-2 bis P2-6 sowie P3 werden hier nicht als erledigt markiert.
