# Lotsora: ergänzender Arbeitsplan nach der Architekturanalyse

Plan erstellt am 10.09.2026; Fortschritt ergänzt am 16.09.2026. **Einstieg freigegeben; Sicherheitsblock, B4, B3 und B5/N7 lokal umgesetzt und geprüft. Das Gesamt-Gate bleibt offen.** Ergänzt [LP-002, Stand 08.09.2026][plan], ersetzt weder dessen Tagesnummern noch bestehende PP-Beschlüsse. Technischer Ausgangspunkt: 4c20755. Befunde und Begründungen stehen im [Analysebericht](ANALYSE-2026-09-10.md).

## Erledigter Block und nächster Einstieg

Die isolierte Testbasis läuft reproduzierbar. F01 (Dokument-/Dateizuordnung), F02 (öffentlicher Leser) und F04 (Auth-Redirect) sind implementiert; interne Dokumentnotizen und öffentliche Rückgabetypen sind im Zuge dessen begrenzt. Die Prüfungen und verbleibenden Grenzen stehen im [Abschluss vom 12.09.2026](ABSCHLUSS-2026-09-12.md). Damit sind die technischen Arbeiten der Einstiegssitzungen 1–4 und der Redirect-Anteil von Sitzung 5 abgedeckt; eine Browser-/Gesamt-MVP-Abnahme wird daraus nicht abgeleitet.

Auf den ausdrücklichen Folgeauftrag „push main“ wurde der geprüfte Sicherheitscommit a4af125 einschließlich N1/N2 nach main übernommen. Die nächste Sitzung setzt dort an. Datenbankübernahme, Gate und öffentlicher Betrieb bleiben davon getrennt.

B4/F03 ist im lokalen Commit `29fe352` umgesetzt: Datenbankregeln, atomare Statuswechsel, Konfliktschutz und echte Parallel-/Rollbacktests. Details, API-Vertragsänderung und Umgebungsgrenzen stehen im [B4-Abschluss vom 14.09.2026](ABSCHLUSS-2026-09-14-B4.md).

B3/F05 baut im lokalen Commit `18fcf89` darauf auf: dauerhafte Upload-/Dateibezüge, fortsetzbare Löschungen, Uploadkompensation und Bedienung offener Vorgänge. 59 Integrationstests sowie gezielte Browserprüfung bestanden; siehe [B3-Abschluss vom 15.09.2026](ABSCHLUSS-2026-09-15-B3.md).

B5/N7 ist auf `codex/b5-uploads-produktbild` umgesetzt: authentifizierte direkte Uploads bis 10 MiB mit serverseitiger Inhaltsprüfung, Produktbild mit kontrolliertem Austausch und optionale interne Artikelnummer. 64 Unit- und 70 Integrationstests bestanden; gezielte Browserprüfung einschließlich Uploadabbruch abgeschlossen. Details und Grenzen stehen im [B5/N7-Abschluss vom 16.09.2026](ABSCHLUSS-2026-09-16-B5-N7.md). Die Migrationen gelten weiterhin nur in der isolierten Testinstanz. **Nächster Baublock: N9/F07 und UX-Abgleich – Autosave, ungespeicherte Änderungen und Veröffentlichung koordinieren.** Push bleibt gemäß Auftrag bis zum gemeinsamen Ende zurückgestellt. Größere Template-/Versions-/Importänderungen und der Livegang sind durch diesen Abschluss nicht freigegeben.

## Rahmen und Reihenfolge

Der letzte abgeschlossene Lerntag bleibt 27/40. Die unten genannten Arbeitstage sind zusätzliche Sitzungen im Phase-5-Nachlauf, keine Umnummerierung zu Tag 28. Eine Sitzung ist mit etwa zwei Stunden geplant; ein nicht abgeschlossener Block wird fortgesetzt. Der bisherige Rahmen von 8–10 Stunden pro Woche bleibt eine vorsichtige Planungsannahme.

Priorität: kritische Zugriffs-/Architekturgrenzen → offene Gate-Punkte und Datenintegrität → stabile Textil-V1 → kleine Erweiterungsvorbereitung → größere neue Funktionen. Architekturentscheidungen zu Veröffentlichungsstand, Feldern und Eigentum früh treffen; ihre großen Implementierungen werden nicht als neue Gate-Bedingung eingeschoben.

Nach jedem Block: geprüften Commit, Zielumgebung, tatsächliche Ergebnisse, Restfehler und nächsten Einstieg festhalten. Keine Cloud-Migration, kein Merge/Push mit ungeklärtem Deployment und kein Livegang als Nebenwirkung einer lokalen Gate-Abnahme. Der vorliegende Analyseauftrag führt davon nichts aus.

## Nächste fünf Arbeitstage

### Arbeitstag 1 — Sichere Testbasis und Integrationsplan

- **Ziel:** Einen reproduzierbaren lokalen Ausgangspunkt für die Sicherheitskorrekturen besitzen.
- **Aufgaben:** Vorhandenen Branch und Remote nochmals auf zwischenzeitliche Änderungen prüfen; N1/N2 als vorhandene Arbeit übernehmen. Docker/Supabase-Verfügbarkeit herstellen bzw. Pfad klären. Eine ausdrücklich isolierte lokale Testinstanz mit synthetischen Herstellern A/B, Entwurf/veröffentlichtem Produkt und internen/öffentlichen Dateien vorsehen. Startanleitung, Migrationsstand und erwartete Ergebnisse festhalten. Keine bestehende Entwicklungs- oder Cloud-DB blind zurücksetzen.
- **Dateien/Bereiche:** README, supabase/config.toml, vorhandene Migrationen; neu tests/integration/ oder supabase/tests/ nach Wahl des Testwerkzeugs; package.json nur für benötigten Testbefehl.
- **Definition of Done:** Bekannter Commit und DB-Stand; zwei getrennte Nutzersessions und anonymer Zugriff reproduzierbar; Integrationsweg für N1/N2 schriftlich festgelegt. Bericht von heute dient als Basis, keine komplette Neuanalyse.
- **Tests:** Testsockel, Typ-/Lintprüfung auf dem späteren Änderungsstand; migrationsbasierter Neuaufbau ausschließlich in der Testinstanz; Auth-Trigger legt pro Testkonto eine Firma an. Google-Font-Buildproblem in geeigneter Netzumgebung prüfen und Ursache protokollieren.
- **Risiken/Abhängigkeiten:** Docker ist in dieser Sitzung nicht über PATH auffindbar gewesen. Einrichtung kann den ganzen Zweistundenblock beanspruchen. Kein Zugriffscheck mit privilegiertem DB-Benutzer als Ersatz für A/B/anon.

### Arbeitstag 2 — Öffentlichen Leser von der Herstellersession lösen

- **Ziel:** Öffentlicher Textilpass zeigt in allen drei Besucherkontexten denselben freigegebenen Inhalt.
- **Aufgaben:** F02 zunächst am Ist-Stand reproduzieren. Cookie-freien öffentlichen Supabase-Client einführen; öffentliche Route/Metadaten über diesen lesen. Interne Vorschau beim Nutzerclient belassen. Öffentliche Feldliste und minimale Rückgabetypen konkretisieren; keine fremden internen Rechte öffnen.
- **Dateien/Bereiche:** lib/supabase/server.ts plus separates öffentliches Modul, lib/services/products.ts, lib/services/documents.ts, app/p/[id]/page.tsx; Tests aus Arbeitstag 1.
- **Definition of Done:** A, B und ausgeloggt sehen denselben freigegebenen Pass. B erhält weder A-Editor noch A-Entwurf/interne Dokumente. Öffentlicher Client hat keine privilegierten Credentials und keine Sessioncookies.
- **Tests:** Positiv-/Negativmatrix A/B/anon; bekannte/ungültige/alte ID, veröffentlichter/entzogener Pass; Vorschau nur Eigentümer. Keine rein gemockte Freigabe.
- **Risiken/Abhängigkeiten:** Tatsächliche Grants/Policies aus Arbeitstag 1; öffentliche Feldliste nicht durch SELECT * erweitern. Falls dieser Block länger dauert, Arbeitstag 3 entsprechend verschieben.

### Arbeitstag 3 — Dokument-/Dateizuordnung nachweisen und Korrektur festlegen

- **Ziel:** F01 ist auf isolierten Testdaten eindeutig bestätigt oder widerlegt.
- **Aufgaben:** Hersteller A versucht, einen bekannten internen Storage-Pfad von B an sein eigenes veröffentlichtes Produkt zu hängen. Insert und Update über direkte API testen. Auch eigenes falsches Produkt, nicht vorhandenes Objekt und ungültige Pfadstruktur prüfen. Kleinsten belastbaren DB-/Storage-Vertrag für Produktordner, Datei und Dokument festlegen; vorhandene Dokumente auf mögliche Abweichungen ausschließlich lesend prüfen.
- **Dateien/Bereiche:** tests/integration/ oder supabase/tests/, documents-Service, vorhandene Dokument-/Storage-Policies; Entwurf einer neuen Migration.
- **Definition of Done:** Reproduktionsprotokoll und konkreter Korrekturentwurf mit Behandlung bestehender Daten. Falls widerlegt, Nachweis festhalten und keinen unnötigen Umbau durchführen.
- **Tests:** Manipulation darf nach Korrektur weder Dateien lesen noch öffentliche Links erzeugen können; legitimes internes/öffentliches Dokument muss weiter funktionieren.
- **Risiken/Abhängigkeiten:** Ausschließlich synthetische fremde Testdateien. Keine stille Löschung/Neuzuordnung auffälliger Altdateien. Dieser Tag ist Diagnose/Entwurf, nicht die Behauptung einer schon geschlossenen Lücke.

### Arbeitstag 4 — Dokumentgrenze schließen und regressionstesten

- **Ziel:** Bestätigte Lücke F01 ist behoben.
- **Aufgaben:** Neue Migration mit Eigentums-/Pfadbindung und gegebenenfalls ergänzender öffentlicher Storage-Prüfung. Alle erlaubten Schreibpfade abdecken. Bestehende gültige Dateien erhalten. Öffentliche Dokumentmetadaten begrenzen; Notizfeld nicht versehentlich öffentlich behandeln. Typen aus der geprüften Test-DB regenerieren.
- **Dateien/Bereiche:** neue supabase/migrations/*_dokument_zuordnung.sql, lib/services/documents.ts, lib/types/database.types.ts, Integrationstests.
- **Definition of Done:** Fremde Dateien bleiben auch bei bekanntem Pfad privat; legitimer Upload/Öffnen/Freigeben/Rücknahme funktioniert; Migrationsweg ohne unbeabsichtigten Datenverlust nachgewiesen.
- **Tests:** Sämtliche Fälle aus Arbeitstag 3; Update von product_id/file_path/visibility; Dokumentfreigabe bei Entwurf; RLS als A/B/anon.
- **Risiken/Abhängigkeiten:** Vorhandene fehlerhafte Pfade können eine Constraint-Migration blockieren. Bei Bedarf Folgesitzung für kontrollierte Bestandsbehandlung einplanen, keine halbfertige Freigabe.

### Arbeitstag 5 — Redirect-Randfall schließen, DB-Invarianten konkretisieren

- **Ziel:** F04 beseitigen und B4 als nächsten prüfbaren Bauauftrag festlegen.
- **Aufgaben:** Auth-Redirect auf normalisierte interne Ziele begrenzen, gültigen Dashboard-/Passwort-Reset-Flow erhalten. Für Veröffentlichung/Speichern die verbindlichen DB-Invarianten und erlaubten Schreibwege festlegen; direkte API, save_product und replace_product_materials ausdrücklich erfassen. Kleinsten Konfliktschutz pro Produkt auswählen.
- **Dateien/Bereiche:** app/auth/confirm/route.ts und fokussierter Test; lib/services/products.ts; neue B4-Migration vorbereiten.
- **Definition of Done:** Steuerzeichen-Ziel bleibt auf eigener Origin bzw. fällt auf erlaubtes Ziel zurück. B4-Testfälle und Migrationsentwurf sind konkret; B4 gilt erst nach dem folgenden Block als umgesetzt.
- **Tests:** Absolute/protokollrelative URLs, Tab/LF/CR, Backslashes, normale interne Ziele, abgelaufener/ungültiger Bestätigungstoken im isolierten Ablauf. Für B4 negative SQL-/API-Fälle vorbereiten.
- **Risiken/Abhängigkeiten:** Testkonfiguration deckt heute nur lib/**/*.test.ts ab; gezielt erweitern, ohne Testdateien auszuführen, die reale Dienste voraussetzen. Auth-Mails nur über die isolierte lokale Testumgebung.

## Danach: bestehendes lokales Gate vervollständigen

Jeder Block kann mehrere Zweistunden-Sitzungen benötigen. Aufwand ist eine erste Schätzung nach Codelektüre; nach der praktischen Zugriffsprüfung neu schätzen.

| Block | Ziel und konkrete Aufgaben | Betroffene Dateien/Bereiche | Definition of Done | Notwendige Tests | Risiken/Abhängigkeiten | Grobe Spanne |
|---|---|---|---|---|---|---|
| B4 / F03 — lokal abgeschlossen | Veröffentlichungsregeln bei allen Writes erzwingen; atomare Veröffentlichung; Produktkonflikte absichern; gespeicherte Materialsummen nach Rundung prüfen | Neue Migrationen, products-Service/Actions, DB-Typen | Direktes API-Schreiben/RPC kann keine unvollständigen veröffentlichten Daten oder Summe >100 erzeugen; <100 bleibt Warnung | Direct API, RPC, fehlende Pflichtfelder, Rollback über vier Tabellen, zwei parallele Transaktionen, Rundungsgrenzen | Nicht nur UI schließen; Transaktionssperren/Trigger nicht rekursiv bauen | 4–6 h |
| B3 / F05 – lokal erledigt 15.09. | Wiederholbare Datei-/Produktlöschung mit erhaltenem Fehler-/Objektbezug, Uploadkompensation | Services, Löschactions, offene Dateivorgänge, Migration `dateiloeschung_fortsetzbar` | Dauerhafter Bezug und gezielter erneuter Versuch; Abschluss erst nach DB-Prüfung; IDs reserviert | 19 B3-Integrationstests zusätzlich zu 40 bestehenden; gezielte Browserprüfung | DB und Storage bleiben getrennt; kein Hintergrunddienst, noch keine Übernahme in Entwicklung/Cloud | abgeschlossen |
| B5 + N7 – lokal erledigt 16.09. | PDF/Bilder bis 10 MiB direkt an Storage; MIME/Inhalt/Größe serverseitig prüfen; Produktbild und optionale interne Artikelnummer | Upload-Hook, Serverprüfung, Dokument-/Bild-Services, Produktformular, RPCs, privater Bucket, Passanzeige | Upload/Abbruch/Ersetzen/Löschen geprüft; Artikelnummer bleibt optional und intern | 11 neue Unit- und 11 neue Integrationstests; Browser mit 10-MiB-PDF, falschem Inhalt, Bildtausch/-entfernung und verzögertem Abbruch | Neue Serverkonfiguration und drei Migrationen gemeinsam übernehmen; Bestandsprüfung und Live-Hostingtest bleiben erforderlich | abgeschlossen |
| N9 / F07 + UX-Abgleich | Autosave auf bestätigten Stand beziehen, Materialentfernung sichern, Publish mit pending/dirty koordinieren; Checkliste/Datenlücken/Editorablauf gegen PP-018/019 prüfen | ProduktFormular, MaterialAbschnitt, VeroeffentlichenAbschnitt, Dashboard | Keine still verlorenen Änderungen in geprüften Fällen; verständliche Fehler/Wiederholung; dokumentierte MUSS-Abweichungen erledigt oder ausdrücklich entschieden | Verzögerte/fehlgeschlagene Saves, nur Zeile entfernen, Navigation, zwei Tabs, Publish während Save, Erstprodukt bis erster Pass | Umfang der bestehenden geführten/klappbaren UX nicht durch neue KI-UX ersetzen | 4–8 h |
| N3 | Gemeinsame Passladung für Metadaten/Seite; passende Caching-API anhand installierter Next-Doku; definierte Invalidierung und erneuerbare Dokumentlinks | Öffentlicher Client, products/documents-Services, app/p/[id], relevante Actions | Keine vermeidbare Doppelladung; Cache enthält nur erlaubte Daten; Änderungen/Rücknahme und Linkablauf innerhalb festgelegter Grenzen | Abfrageanzahl, A/B/anon, TTL überschritten, Produkt-/Hersteller-/Dokumentänderung, Rücknahme/Wiederveröffentlichung, DB-Ausfall | Vorher Zugriff schließen; konkrete Fristen entscheiden. Signierte Links nicht länger als nutzbar cachen; keine unbelegte Sofort-Widerrufszusage | 4–8 h |
| N8 + QR + proxy | Eindeutige Feld-IDs, Tastatur/Fokus/Kontrast/Mobilansicht; QR-Rand vier Module; middleware-Konvention migrieren | Pass-/Editor-/Dokumentkomponenten, lib/qr.ts, QR-Aktionen, middleware/proxy | Lokaler Grundpass protokolliert; Export technisch mit ausreichendem Rand; Auth-/Routenschutz erhalten | Tastatur, 320/375px/Zoom, Screenreader-Stichprobe, SVG/PNG dekodieren, Auth-Regressionsfälle; Druck mit Handys spätestens vor Kundeneinsatz | Physischer Test benötigt Drucker/Handys und festgelegte Etikettengröße | 4–6 h |
| F / kleine Architekturgrundlagen | Template-/Feldkennungen, Quellenvertrag, Herstellergrenze, Publikationsrevision und Identitätsgranularität als begrenzte Entwürfe festhalten; kleine Katalogvorbereitung nur nach Freigabe | docs/PRODUKTVISION, Architekturentscheidungsentwürfe; ggf. lib/templates und additiver Versionsbezug | Konkrete Erweiterungspunkte und späteste Umsetzungszeitpunkte dokumentiert; keine vollständige Engine | Bei Code: vorhandener Textilpass/Editor identisch, unbekannte Version kontrolliert abgewiesen; sonst Dokumentationsprüfung | Kein zusätzliches KI-/Mehrfirmen-Gate; vorziehen, falls ein vorheriger Schemafix diese Grenzen berührt | 2–4 h |
| Lokaler Systemcheck | Alle aktuellen Nachlaufpunkte auf vorgesehenem Integrationsstand abnehmen, Ergebnisliste mit Belegen erstellen | Tests, Dokumentation, vollständiger lokaler Ablauf | N3/N7/N8/N9 erledigt, F01–F08 eingeordnet/behoben soweit freigaberelevant, offene Punkte explizit; Kevin erhält Gate-Vorlage | A/B/anon, Produkt/Datei/Pass/QR, ungültige IDs, N1-Unveränderlichkeit/Nichtwiederverwendung, Save/Rollback, Lint/Typen/Build | Nicht mit nur einem Eigentümerbrowser prüfen; Build muss in geeigneter Umgebung bestehen | 2–4 h |

Aktualisierung 14.09.: B4 ist abgeschlossen. Die ursprünglichen Spannen unten dokumentieren den Planungsstand vom 10.09.; rechnerisch verbleiben für die weiteren Blöcke etwa 26–46 Stunden. Das ist noch keine praktische Neuschätzung.

Die Spannen sind keine feste Fertigstellungszusage. Nach fünf Einstiegssitzungen ergibt die Liste weitere etwa 30–52 Stunden, teils überlappend. Der Gesamtumfang liegt damit grob bei **40–62 Stunden** für dieses vorgeschlagene Paket, inklusive gezielter Tests und kleiner Konzeptarbeit, ohne neue Import-/KI-Engine und ohne Cloud-Livegang. Bei 8–10 Stunden pro Woche sind das etwa 4–8 Wochen. Die vorhandene Zielrichtung bis 19.10. und die im LP-002 vorgesehene Pause ab 20.10. bleiben Kapazitätsgrenzen, kein Anlass, das Gate abzukürzen. Nach dem ersten praktisch geprüften Block Aufwand neu schätzen.

## Nach ausdrücklicher lokaler Gate-Freigabe: bestehende Tage 28–30

| Lerntag | Ziel | Konkrete Aufgaben/Dateien | Definition of Done | Tests | Risiken/Abhängigkeiten |
|---|---|---|---|---|---|
| 28 | Realistische Textilfälle vorbereiten | Reproduzierbare Fixtures für mehrere Hersteller, vollständige/unvollständige Produkte, Dokumenttypen und Soll-Ergebnisse; Testanleitung | Testdaten isoliert, Datenherkunft bekannt, erwartete Resultate beschrieben | Fixture-Aufbau/-Abbau; Daten dürfen keine realen Kundeninformationen ohne Freigabe enthalten | Lokales Phase-5-Gate muss freigegeben sein; die vorherigen Sicherheitsfixtures ersetzen diesen fachlichen Tag nicht |
| 29 | Regression und Stabilisierung automatisieren | Tests aus Gate-Blöcken bündeln, relevante Browserabläufe ergänzen; .github/workflows/ für Tests, RLS, Lint, Typen, Build | Wiederholbarer CI-Lauf in isolierter Umgebung und behobene relevante Regressionen | Vier-Tabellen-Rollback, A/B/anon, Datei-/Status-/ID-/Cache-Fälle und Happy Path | Keine Produktionsschlüssel in CI, kein Deployment als Testnebenwirkung |
| 30 | MVP und Verständlichkeit abnehmen | MVP.md/Wireframes punktweise gegen Funktion prüfen, Abnahmeprotokoll; Onboarding-/Datenlücken-/Editorabweichungen schließen oder bewusst entscheiden | Jeder MUSS-Punkt mit Nachweis oder offenem Beschluss; Vorlage für Gate „MVP testbereit“ | Vollständiger Textilablauf ohne Hilfestellung soweit praktisch möglich, Fehlerfälle, mobile Passansicht | Kundenfeedback berücksichtigen, falls vorhanden; keine erfundenen Interviews/Erfolgsnachweise |

## Vor öffentlichem Livegang: bestehendes separates Paket

| Schritt | Ziel/Aufgaben und Bereiche | Definition of Done | Tests | Risiken/Abhängigkeiten |
|---|---|---|---|---|
| N4 Cloud-Rollout | Migrationsstand und Auth-Konfiguration vergleichen, geprüfte Migrationen ausrollen, Site-/Redirect-URLs, Maildienst, Region und Deployment-Schutz prüfen | Cloud entspricht freigegebenem Schema/Setup; Preview-/vercel.app-Zugriff entspricht Veröffentlichungspause bis Freigabe | A/B/anon, Auth/Reset, zulässige große Uploads, Abbruch, ungültige Dateien unter realem Hosting | Gesonderte Freigabe; lokale Config ist kein Cloudnachweis |
| N5 Backup/Restore | Datenbank inklusive privater public_id-Reservierung, Storage-Dateien und benötigte Konfiguration sichern; getrennten Restore proben | Wiederherstellung mit Zeit-/Ergebnisprotokoll und erhaltener ID-/Dateizuordnung | Restaurierte Pässe/Dateien/Hersteller prüfen; keine reservierte ID erneut vergeben | Kein reiner SQL-Dump als vollständiges Dateibackup ausgeben |
| N6 Monitoring | Fehler- und Uptime-Überwachung für Pass/Downloads konfigurieren, verantwortlichen Alarmweg festlegen | Testalarm kommt an; Fehler im anonymen Pfad werden bemerkt | Gezielt ausgelöster Fehler und Ausfall in geeigneter Testumgebung | Keine unnötigen Produkt-/Quelldaten in Logs |
| Betreiberangaben und DNS | Vollständige Texte für den tatsächlichen Betrieb prüfen lassen; DNS nach aktuellen Anbieterwerten vorbereiten | Konkrete Livegang-Vorlage und ausdrückliche Freigabe, erst danach Verbindung | Domain/HTTPS, Weiterleitungen, kanonische QR-URL, Rechte-/Betriebsmatrix | Platzhalter-Datenschutz ist keine vollständige SaaS-Freigabe; keine alten DNS-Werte blind übernehmen |

## Erweiterungen nach stabilem Kern, anhand konkreter Auslöser

| Paket | Auslöser und Ziel | Bereiche / Abnahme | Tests / Abhängigkeiten |
|---|---|---|---|
| Veröffentlichungsrevision + Textiltemplatebezug | Vor erster Funktion, die „öffentlich unverändert bis Freigabe“ verspricht | Bearbeitungsstand getrennt von freigegebenem Pass; Akteur/Revision/Template-/Dateiversion nachvollziehbar | Backfill ohne erfundene Prüfung; Revision bleibt unverändert, Freigabe atomar, alte Editorstände blockiert; gesonderter Beschluss zu PP-010/011 |
| CSV/XLSX-Import | Freigegebene repräsentative Produktliste und klare Produktzuordnung vorhanden | Adapter, Mapping, Vorschau, Quellenbezug, manuelle Bestätigung, Wiederimport-Vergleich | Führende Nullen, Einheiten/Dezimalzeichen, leere Zellen, Dubletten, Teilerfolg/Wiederholung; keine automatische Veröffentlichung |
| PDF-Inhaltsübernahme | Ausgewählte häufige Datenblatt-/Nachweistypen bekannt | Extraktion getrennt von Upload; Wert und Fundstelle zur Prüfung | Text-PDF/Scan unterscheiden, unsichere Werte offenlassen, Quellversion erhalten; OCR/KI nur nach konkreter Bewertung |
| KI-Unterstützung | Dokumentfälle zeigen messbaren Zusatznutzen gegenüber Parsern/regulären Regeln | Kandidaten erzeugen, Quellen zeigen, Konflikte markieren | Kein KI-Publish/Bestätigen; tenant-sichere Jobs, fehlerhafte Extraktion und untrusted Dokumentanweisungen, Kosten-/Mengenbegrenzung |
| Teams/Brands/mehrere Firmen | Erster bestätigter Pilotbedarf | Mitgliedschaften/aktiver Hersteller, Brandzuordnung, getrennte Verantwortliche | Gesamte RLS-Matrix neu prüfen, letzte verantwortliche Person/Nutzerlöschung, Migration bestehender Firmen |
| Weitere Branchen/Varianten | Belegter Bedarf und fachlich verantwortbare Vorlage | Zusatzschema plus passende Regeln/Relationen/Editorabschnitte | Alte Textilprodukte/QRs unverändert; Produktgranularität und Semantik geklärt |
| Weitere Formate, APIs, Lieferanten, Tasks, Analytics, Bulk | Wiederkehrender realer Ablauf oder gemessene Grenze | Gleiche Quellen-/Übernahme-/Freigabegrenzen weiterverwenden | Berechtigungen, Idempotenz, Konflikte, Datenumfang; eigenes begrenztes Paket vor Umsetzung definieren |

Kundengespräche mit Textil-/Apparel-Unternehmen beginnen nach vorzeigbarem Kern, wie am 08.09. präzisiert. Weder die vollständige Templatefunktion noch Imports oder KI sind Voraussetzung dafür. Phasen 7–9 / Tage 31–40 (kommerzielles Lernen, Preisvalidierung, Marktauftritt, Vertrieb, Zahlung) bleiben bestehen. Kein fester Preis und kein Umsatzdatum wird hier beschlossen.

## Freigabeumfang

Der Analyseauftrag vom 10.09. wurde vor Codeänderungen abgeschlossen. Kevin hat anschließend mit „dann starten wir jetzt weiter“ den Einstieg freigegeben. Die Folgeaufträge umfassen B4, B3 und B5/N7; B5/N7 wurde am 16.09. nach der Pause fortgesetzt. **Sicherheitsblock, B4, B3 und B5/N7 sind lokal umgesetzt und geprüft; kein Gesamt-Gate und kein Livegang wurden freigegeben.**

[plan]: https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/KI_Lernen/LERNPL%C3%84NE/LP-002/PLAN.md
