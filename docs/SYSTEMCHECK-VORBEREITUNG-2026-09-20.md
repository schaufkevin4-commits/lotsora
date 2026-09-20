# Lokaler Gesamtsystemcheck – gezielte Vorbereitung

**Ausgeführt am 20.09.:** Die N1-Lücke und der echte Auth-Mailablauf sind jetzt durch zusätzliche Tests geschlossen; der zusammenhängende Browserablauf ist protokolliert. [Ergebnisse, Korrekturen und verbleibende manuelle Nachweise](SYSTEMCHECK-2026-09-20.md). Der folgende Text dokumentiert die ursprüngliche Vorbereitung.

**Fortschritt nach dieser Vorbereitung:** Teammodell am 20.09. lokal implementiert und geprüft, jetzt 22 Migrationen in `lotsora-integration`. [Team-Abschluss](ABSCHLUSS-2026-09-20-FIRMENTEAMS.md). Die unten beschriebene Gesamt-Abnahme bleibt der nächste Schritt; die historische Aussage „kein neuer Testlauf“ bezieht sich auf den ursprünglichen Vorbereitungsblock.

Stand: 20.09.2026, `f652e0cae32159c9a75acdf310e99c283ca843a1`. Beide Arbeitsbäume sauber beim Einstieg; GitHub-main per Connector identisch. **Vorbereitung, kein neuer Testlauf und keine Gate-Freigabe.** Kevin hat anschließend die Richtungen A1–A5 angenommen und mehrere Benutzer derselben Firma bereits in V1 verlangt. Maßgeblich ist der [Architekturbeschluss](ARCHITEKTURBESCHLUSS-2026-09-20.md). Der folgende Plan beschreibt die vorhandene Basis; die abschließende Abnahme muss nach dem Team-Baublock zusätzlich zwei Mitglieder derselben Firma, Einladungen, Rollenentzug und sichere Kontolöschung umfassen.

## Vorhandene Nachweise verwenden

| Befund | Vorhandene Testdateien | Einordnung für den Gesamtcheck |
|---|---|---|
| F01 Datei-/Produkteigentum | `tests/integration/access.test.ts`, `uploads.test.ts` | A/B/anon und manipulierte Dateibindungen abgedeckt; im Gesamtstand beibehalten |
| F02 öffentlicher Leser | `access.test.ts`, `public-http.test.ts` | Gleicher öffentlicher Ausschnitt trotz unterschiedlicher Sessions |
| F03 Veröffentlichungsregeln | `publication.test.ts`, `publication-concurrency.test.ts` | Direkte Schreibwege, atomare Regeln und Konkurrenz; keine neue Revisionssemantik unterstellen |
| F04 Redirect | `lib/auth/redirect.test.ts` | Funktionsnachweise vorhanden; echter lokaler Bestätigungs-/Resetablauf bei Gesamt-Abnahme separat nachweisen |
| F05 Löschung | `deletion.test.ts`, `deletion-concurrency.test.ts` | Wiederholung, Storagefehler, verlorene Antworten und erhaltene Bezüge |
| F06 Uploadvertrag | `uploads.test.ts`, `lib/uploads/validate.test.ts` | Direkter Upload und Inhalts-/Größenprüfung; Produktionshosting bleibt N4 |
| F07 Autosave | `editor.test.ts`, `lib/editor-save.test.ts` | Veralteter Tab, Statuswechsel, Konflikte; sichtbarer Gesamtweg zusätzlich erforderlich |
| F08 öffentliche Felder | `public-pass.test.ts`, `public-http.test.ts`, `lib/services/documents.test.ts` | Explizite Grants/Projektion und Fehlerzustände; fachlicher PP-Abgleich für Waschhinweise/Wiederverwendung weiter sichtbar halten |

Nicht voll ausgeschriebene Testpfade in der Tabelle liegen unter `tests/integration/`. Der neue QR-Nachweis vom 19.09. bleibt gültiger Einzelnachweis; für einen neuen Testpass die tatsächlichen Exporte erneut gegen dessen URL prüfen.

## Konkrete noch zu ergänzende Nachweise

- **N1-ID-Garantien:** `lib/public-id.test.ts` prüft das Format; `deletion.test.ts` prüft die erhaltene Reservierung nach Produktlöschung. Ein vollständiger direkter DB-Nachweis zu unveränderlicher ID, vom Server erzeugter ID trotz Clientvorgabe und Wiederverwendungsversuch ist in der gezielt gelesenen Suite nicht gefunden. Beim nächsten Testblock gezielt prüfen/ergänzen; nicht als Produktfehler ausgeben.
- **Ein zusammenhängender Bedienablauf:** A legt ein Produkt an, speichert Material-/Textildaten, lädt Bild und internes Dokument hoch, gibt bewusst frei, veröffentlicht, öffnet den Pass und exportiert QR; B und anon sehen nur die erlaubten Inhalte. Anschließend ändern, zurücknehmen, wiederveröffentlichen und löschen; Dateibezüge/Bereinigung und alte Passadresse prüfen. Einzeltests ersetzen dieses Ablaufprotokoll nicht.
- **N8 manuell:** Screenreader, separater nativer 200-%-Zoom auf `/p/`, physischer Druck-/Handyscan und Etikettengröße bleiben offen. Kevin hatte die Screenreader-Stichprobe am 19.09. ausdrücklich vertagt.
- **Ausführungsgrenzen:** Bereits ausgegebene signierte Links bleiben befristet gültig; laufende Lesungen sind kein atomarer Gesamtsnapshot. Testbericht muss diese bekannten N3-Grenzen wiedergeben und darf keinen sofortigen Widerruf behaupten.

## Reihenfolge des nächsten Testblocks

1. Git-/Konfigurationsstand sichern. Nur `lotsora-integration` (API 55321, DB 55322) starten; 21 Migrationsdateien mit tatsächlich angewendetem Schema abgleichen. Kein Reset, kein Cloudprojekt und keine automatische Migration in die normale Entwicklungsumgebung.
2. Gezielte N1-Nachweislücke schließen. Vorhandene Tests wiederverwenden; keine zweite parallele Testinfrastruktur aufbauen.
3. Für die zusammenhängende Gate-Abnahme einmal den aktuellen Stand prüfen: Unit-Tests, Lint, Typprüfung, DB-Integration und Produktions-HTTP-Tests. Der vorhandene HTTP-Helfer führt den Produktionsbuild bereits selbst aus; keinen doppelten Build einplanen.
4. Den beschriebenen Bedienablauf und verfügbare N8-Nachweise protokollieren. Testdatenbereinigung prüfen, eigene Server und Testinstanz stoppen, ausschließlich eigene temporäre Änderungen zurücknehmen.
5. Gate-Vorlage mit Commit, Schema, Ergebnissen, verbleibenden MUSS-Punkten und Entscheidungen erstellen. Eine erfolgreiche Testsuite ersetzt Kevins Gate-Entscheidung nicht.

Vorhandene Befehle: `npm test`, `npm run lint`, `node node_modules/typescript/bin/tsc --noEmit`, `node scripts/integration.mjs start`, `node scripts/integration.mjs test`, `node scripts/integration.mjs http`, `node scripts/integration.mjs browser`, `node scripts/integration.mjs stop`. Browserhelfer über `.local-tests/n8-browser-stop` regulär beenden. Die Befehle sind hier nur dokumentiert, nicht ausgeführt.

Keine pauschalen Paketupdates, Architekturimplementierung, Migration, Veröffentlichung oder Wiederholung der historischen Grundanalyse in dieser Vorbereitung.
