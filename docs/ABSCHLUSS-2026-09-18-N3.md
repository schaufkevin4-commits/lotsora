# N3 – gemeinsame Passladung und erneuerbare Dateilinks

Umgesetzt und lokal geprüft am 17.–18.09.2026. Ausgangspunkt `4ca4b3ccf985e90ba3ee88c13d9a1b4106a7b7b0`, bestehender Branch `codex/n9-autosave-veroeffentlichung`. Beim Einstieg sauber; Änderungen bleiben uncommitted in diesem Arbeitsbaum. Kein Branchwechsel, Commit, Push, Deployment oder Cloudzugriff. Ausschließlich N3 bearbeitet.

## Ergebnis

- `lib/public-pass.ts`: Seite und Metadaten verwenden denselben anonymen, mit React `cache` pro Server-Renderpass geteilten Loader. Dynamisches Rendering und `no-store` bleiben erhalten; kein persistenter Passcache und kein nutzerspezifischer öffentlicher Leser. Der echte Produktionsserver belegt sieben relationale Abfragen für Seite und Metadaten zusammen sowie erneut sieben bei der nächsten Anfrage. Kein Signierungsaufruf beim Laden des Textpasses.
- `lib/services/products.ts` und `documents.ts`: öffentliche Dateien erhalten stabile App-Adressen. Dokumente verwenden im öffentlichen DTO jetzt `url` statt `signedUrl`; interne Dokumentverwaltung behält ihre Signaturen. Die Vorschau bildet Dokumente explizit auf die Anzeigeattribute ab.
- `app/p/[id]/bild/route.ts`, `app/p/[id]/dokumente/[documentId]/route.ts` und `lib/services/public-files.ts`: beim Öffnen aktuelle Veröffentlichung und Dateizuordnung anonym prüfen, dann für 300 Sekunden signieren. Kein Besucher kann einen beliebigen Storagepfad übergeben. Redirects und Fehlerantworten sind `private, no-store`; nicht verfügbare Bezüge ergeben 404, temporäre Dateifehler 503 mit Wiederholungslink. Die Storage-RLS prüft die Freigabe beim Signieren erneut.
- `components/produkte/pass-bild.tsx`: verständlicher Bildfehler und bewusstes erneutes Laden; Textpass bleibt bei Storageproblemen lesbar. Ein Produktzeitstempel in der Bildadresse löst bei geändertem Stand auch unter Clientnavigation einen neuen Bildabruf aus. Dieser Parameter verleiht keine Rechte und ist keine Veröffentlichungsrevision.
- `app/p/[id]/page.tsx`: Datenbankausfälle erhalten eine eigene Fehleranzeige samt neuem Seitenabruf; unbekannte/unveröffentlichte Pässe behalten den neutralen Hinweis. Fehler-Metadaten enthalten keine alten Produktangaben. Keine DB-Details im Browser. Der öffentliche Client begrenzt einzelne Fetches auf acht Sekunden und deaktiviert automatische DB-Retries; interne Schreibclients bleiben unverändert.
- F08: bestehende Waschhinweise und wiederverwendbare Materialien bleiben sichtbar. Migration `20260917120000_oeffentliche_detailfelder.sql` ersetzt pauschales anon-SELECT auf den drei Detailtabellen durch explizite bestehende Spaltenrechte, einschließlich benötigter Filter-/Sortierfelder. RLS und Herstellerrechte unverändert. Datumsbeschriftung lautet jetzt „Produktdaten zuletzt gespeichert“; kein Anspruch auf den Änderungszeitpunkt sämtlicher Passbestandteile.

## Umgesetzter V1-Vertrag und Grenzen

Die Empfehlungen aus der Vorbereitung wurden als kleinste technische Auslegung des N3-Umsetzungsauftrags verwendet. Die optionalen Rückfragen erhielten keine gesonderte Antwort; daraus wird kein zusätzlicher fachlicher PP-Beschluss abgeleitet.

1. Eine nach bestätigter Mutation neu begonnene Serveranfrage liest aktuell. Bereits offene Seiten aktualisieren ihren Text nicht automatisch. Browser-Zurück kann vorhandene Darstellung wiederverwenden; Neuladen liest frisch. Kein Polling oder Echtzeitversprechen.
2. Die 300 Sekunden betreffen neu von diesen App-Routen ausgestellte Links. **Rücknahme widerruft bereits ausgegebene Tokens nicht sofort**, im lokalen Test ausdrücklich nachgewiesen. Browser-/Storage-Caches, heruntergeladene Dateien und andere erlaubte direkte Signierungsaufrufe begrenzen jede weitergehende Widerrufszusage. Ein strengerer Zugriffsentzug bleibt eine eigene Entscheidung über den gesamten Auslieferungsvertrag.
3. Die gemeinsame Ladung ist kein atomarer DB-Snapshot. Ein während der Rücknahme schon laufender Abruf kann zuvor gelesene Basisdaten noch ausliefern; im gezielt angehaltenen HTTP-Test belegt. Die nächste Anfrage war gesperrt. Eine strikte Snapshotgarantie wurde nicht eingeführt.
4. Der kontrollierte Seitenfehler ist eine gerenderte Antwort und keine zugesicherte HTTP-503-Antwort der Passseite. Die separaten Dateirouten unterscheiden 404/503. Monitoring und dessen Alarmregeln bleiben N6.
5. Der fachliche PP-Abgleich der beiden vorhandenen optionalen Felder bleibt für die Gesamt-Gate-Einordnung sichtbar; keine neue öffentliche Inhaltsgruppe hinzugefügt. Bei abweichender Feldentscheidung gezielt Projektion und Grants nachziehen.

Getrennte Bearbeitungs-/Veröffentlichungsstände bleiben ausdrücklich offen. Veröffentlichte Pässe lesen weiterhin aktuelle gespeicherte Daten. N9-`editor_version` bleibt ausschließlich Konflikttoken. N9 wird durch diesen Block nicht erneut geöffnet.

## Prüfungen und Aussagegrenzen

| Prüfung | Nachweis |
|---|---|
| Unit-/Regressionstests | 93 bestanden; inklusive Fehlern jeder öffentlichen DB-Teilabfrage, Dateibindung, TTL und nicht cachebaren Dateiantworten |
| Vollständige Integration | 85 bestanden auf `lotsora-integration`; die gesonderten HTTP-Tests werden in diesem Lauf bewusst übersprungen |
| Echter Next-Produktionsserver | 7 separate HTTP-Tests bestanden: geteilte Ladung, Folgeanfrage, vollständige identische Hauptansicht A/B/anon, Metadaten/Statuswechsel, Dateifreigabe, DB-Fehler/Erholung, Acht-Sekunden-Timeout ohne Retry, laufende Lesung bei Rücknahme |
| Abschließende Bild-/Dateiregression | 18 gezielte Integrationsfälle auf dem endgültigen Code bestanden; einschließlich geändertem Bildaufruf nach Tausch |
| Lint, Typprüfung, Produktionsbuild, Diff-Prüfung | bestanden; Next.js 16.3.5, 14 statische Seiten; bekannte middleware-Deprecation bleibt N8 |
| Browser | Öffentliches Bild und Textpass; Storage-Ausfall mit erhaltener Textansicht; Bildwiederholung erfolgreich; DB-Fehler mit neutralem Titel und erfolgreichem Wiederholen; Dokumentfehler und erneuter PDF-Aufruf; Navigation zur Datenschutzseite und zurück |

Die echte Tokenablaufprüfung verwendet eine kurze Test-TTL für Bild und Dokument, ruft die ursprünglichen URLs vor/nach Ablauf tatsächlich bei Storage ab und prüft neue Erteilung. Rücknahme, Wiederveröffentlichung, interne/fremde/gelöschte Dokumente, Bildersatz/-entfernung und fehlende neue Zugriffsrechte sind abgedeckt. Es wurde kein stundenlanger Browser-Langzeittest behauptet. Vollständige Mobile-/Screenreader-Abnahme bleibt N8/Systemcheck.

Die vollständige Integration lief vor der abschließenden Ergänzung des Bild-Standparameters. Danach bestanden die relevanten 18 Integrationsfälle sowie Unit-Tests und Produktions-/Browserprüfungen; die letzten Testergänzungen für Timeout/Parallelfall bestanden ebenfalls. Am 18.09. wurden die zuvor durch ein Nutzungslimit unterbrochene gezielte Prüfung, Lint, Typen und Diff-Prüfung erfolgreich abgeschlossen. Keine unnötige Wiederholung des gesamten Gates.

## Testweg und Umgebung

Vorhandener Weg: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run test:integration`.

Neu: `node scripts/integration.mjs http` baut mit ausschließlich lokalen Supabase-Testwerten und führt die HTTP-Prüfung über Next-Port 3108 und Prüfproxy-Port 55329 aus. Der Proxy leitet nur an `127.0.0.1:55321` weiter; er zählt echte Requests und injiziert gezielte Fehler. `http --browser` hält die Testumgebung höchstens zehn Minuten für eine Browserprüfung offen. Die kurzlebigen Steuerdateien unter `.local-tests/n3-browser-*` werden danach entfernt. `.local-tests/**` ist nun auch von ESLint ausgeschlossen; vorhandene fremde Hilfsskripte darin wurden nicht verändert.

Der HTTP-Test ersetzt das lokale `.next`-Buildartefakt durch einen Testbuild. Für gewöhnlichen Produktionsstart anschließend mit der vorgesehenen Umgebung neu bauen; kein Testbuild für einen späteren Rollout verwenden.

Migrationen: **21 ausschließlich in `lotsora-integration` angewendet und geprüft**. N3 ändert Rechte, keine Tabellen-/RPC-Datentypen; daher keine Typregeneration nötig. Entwicklungsprojekt `lotsora` und Cloud wurden nicht migriert. Vor Übernahme in andere Umgebungen weiterhin Schema und Konfiguration bewusst abgleichen.

Bereinigungsprüfung am 18.09.: null Testkonten, Hersteller, Produkte, Dokumente, Storageobjekte und Dateivorgänge; 21 Migrationen. HTTP-Testserver/Prüfproxy und Prüftabs beendet. Isolierte Supabase-Testinstanz nach Abschluss gestoppt; Volumes erhalten. Die normale Entwicklungsinstanz blieb unangetastet.

## Abschlussgrenze

N3 ist im beschriebenen V1-Umfang lokal umgesetzt und geprüft. Änderungen bleiben zur Durchsicht uncommitted. Gesamt-Gate, Livegang und die genannten weitergehenden Produktentscheidungen bleiben offen. Nächster geplanter Block wäre N8/QR/proxy, **aber nur nach neuem ausdrücklichem Auftrag**. Hier stoppen.
