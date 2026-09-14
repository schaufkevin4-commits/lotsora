# B4/F03: Veröffentlichungsregeln und Datenintegrität

Stand: 14.09.2026. Auftrag: den nächsten Baublock nach dem Sicherheitsabschluss umsetzen. Ausgangspunkt ist main bei 5e05ada. Umsetzung im lokalen Branch `codex/b4-veroeffentlichungsregeln`; dieser Abschluss umfasst B4, keine Gesamt-Gate-Abnahme.

## Ergebnis

- Veröffentlichte Produkte benötigen Name, Beschreibung und Kategorie mit tatsächlichem Inhalt. Die DB-Constraint deckt Insert, Update und RPC ab, einschließlich Whitespace und fehlender Angaben nach Veröffentlichung.
- Materialanteile sind nicht null, liegen innerhalb der vorhandenen Einzelgrenzen und ergeben nach Speicherung höchstens 100 %. Die Summenprüfung gilt für direkte Inserts, Updates, Upserts, Produktwechsel und RPCs. Unter 100 % und eine leere Liste bleiben erlaubt.
- Jede Materialänderung aktualisiert und sperrt ihre Produktzeile; Replace-all sperrt vor dem Lesen/Löschen. Der endgültige Transaktionsstand wird mit einem verzögerten Constraint-Trigger geprüft. Zwischenstände bei einer Umverteilung sind zulässig, ungültige Endstände werden vollständig zurückgerollt.
- `publish_product` und `withdraw_product` führen den jeweiligen Statuswechsel atomar unter Produktsperre aus. Die Services verwenden diese RPCs.
- `save_product` erhält jetzt `p_expected_status` statt `p_status`. Der Status wird nach dem Sperren in der DB abgeleitet. Speichern kann keine Veröffentlichung oder Rücknahme auslösen; ein inzwischen geänderter Status führt zum sichtbaren Konfliktfehler 40001. Der Server-Save übergibt den gelesenen Status und zeigt bei Konflikten eine verständliche Fehlermeldung.
- Materialprüfung in TypeScript und RPC verwenden die Einzelrundung auf zwei Nachkommastellen. Beispielsweise wird 33,335 + 33,335 + 33,33 als gespeicherte Summe 100,01 abgewiesen.
- Datenbanktypen sind aus der migrierten isolierten Datenbank regeneriert.

## Nachweise

Vor der Migration wurden vier Fehlerfälle gegen die echte API reproduziert: drei fehlende Pflichtfelder bei Veröffentlichung sowie ein direkter Material-Insert mit 110 %. Alle vier wurden vom alten Stand fälschlich akzeptiert und vom neuen Stand abgewiesen.

Die Integrationstests prüfen zusätzlich:

- Eigentümer A, fremder Hersteller B und anonyme Besucher bei allen neuen RPCs;
- parallele Material-Inserts unter READ COMMITTED und REPEATABLE READ;
- zwei gleichzeitige Replace-all-Aufrufe ohne Vermischung der Listen;
- Veröffentlichen während eines Saves sowie Speichern während Veröffentlichung/Rücknahme;
- nachweislich wartende konkurrierende Sessions über `pg_stat_activity`, nicht nur zufällige gleichzeitige HTTP-Aufrufe;
- vollständigen Vier-Tabellen-Rollback bei einem gezielt im letzten Formularbereich ausgelösten Fehler sowie bei ungültiger Endsumme am Commit;
- gültige Materialumverteilung und kaskadierte Produktlöschung;
- Abbruch der Migration bei ungültigen Altbeständen: fehlende Pflichtfelder, Summe über 100 und null-Anteil. Daten und Schema werden beim Abbruch zurückgerollt.

Abschließende Prüfungen am 14.09.2026:

| Prüfung | Ergebnis |
|---|---|
| Unit-/Regressionstests | 53 Tests in fünf Dateien bestanden |
| Vollständige Integrationstests | 40 Tests in drei Dateien bestanden; davon 32 B4-Tests und acht bestehende Zugriffstests |
| Lint | bestanden |
| Next-Routentypen + TypeScript | bestanden |
| Produktionsbuild | Next.js 16.3.0, Turbopack, alle 14 statischen Seiten erfolgreich; ausschließlich lokale Testkonfiguration |
| Testbereinigung | null Testkonten, Produkte, Materialien, Dokumente und Storage-Objekte; keine temporären Fehler-Funktionen |

Der erste Buildversuch scheiterte an der Abhängigkeits-Junction außerhalb des neuen Arbeitsbereichs. Nach lokaler Kopie der unveränderten Projektabhängigkeiten bestand der reguläre Turbopack-Build. Die vorhandene Middleware-Deprecation bleibt bestehen. In einem frischen Checkout müssen vor einer eigenständigen Typprüfung mit `next typegen` die Routentypen erzeugt werden.

## Migration und Integrationsgrenze

Migration: `20260914120000_veroeffentlichungsregeln.sql`. Sie wird als ganze Transaktion angewendet, validiert vorhandene Daten und löscht oder korrigiert keine Altbestände. Vor einer Übernahme sind veröffentlichte Pflichtfelder, leere Materialnamen, null-Anteile und Materialsummen lesend zu prüfen; etwaige Bestandskorrekturen sind konkret zu entscheiden.

Die API-Änderung an `save_product` ist bewusst eindeutig: der alte Parameter `p_status` wird nicht mehr akzeptiert. App und Migration müssen deshalb gemeinsam auf einen passenden Integrationsstand gebracht werden. Bis dahin bleibt der bisherige Hauptbranch mit seinem Datenbankvertrag nutzbar.

Die Migration wurde ausschließlich auf `lotsora-integration` (API 55321, DB 55322) angewendet. Das normale Entwicklungsprojekt und die Cloud benötigen weiterhin eine bewusste Übernahme. Dieser Branch wurde nicht gepusht oder öffentlich ausgerollt.

Die isolierte Testinstanz wurde nach erfolgreicher Bereinigung gestoppt; Testvolumes und reservierte öffentliche IDs bleiben erhalten.

Für SQL-Paralleltests dient PostgreSQL nur als lokale Verbindung und zum Testaufbau: die fachlichen Transaktionen wechseln vor ihren Schreibzugriffen auf `authenticated` und die synthetische Nutzer-ID; die Identität wird geprüft. Privilegierte Beobachtung und vorübergehende Fehler-Trigger sind auf den festen Testcontainer begrenzt. Temporäre Trigger werden wieder entfernt.

## Grenzen und nächster Einstieg

Der Konfliktschutz verhindert ungültige Daten und überholte Statuswechsel. Er ersetzt keine Versionsprüfung aller Formularinhalte: zwei gültige Saves mit gleichem Status können weiterhin nach dem Prinzip „letzter Save gewinnt“ arbeiten. Das bleibt Teil von N9/Autosave. Bei komplexen direkten Mehrzeilenänderungen kann PostgreSQL einen Deadlock/Serialisierungskonflikt mit vollständigem Rollback melden; die Anwendung bietet einen erneuten Versuch an.

Materialänderungen aktualisieren jetzt auch `products.updated_at`. Textil-, Nachhaltigkeits-, Hersteller- und Dokumentänderungen sowie der vollständige öffentliche Feld-/Rechteabgleich sind damit nicht insgesamt als F08 abgeschlossen. Browserabnahme, N3/N7/N8/N9 und Gesamt-Gate bleiben offen. Die bekannte Middleware-Konvention wird im geplanten Nachlauf behandelt.

Die nächste Sitzung beginnt auf diesem B4-Branch oder nach dessen bewusster Integration; main enthält B4 bislang nicht.

Nächster Baublock: **B3/F05 – zuverlässige Datei-/Produktlöschung und Uploadkompensation**. Tag 28 folgt nach dokumentierter lokaler Gate-Abnahme und Freigabe.

Technische Grundlage: PostgreSQL-Dokumentation zu [Transaktionsisolation](https://www.postgresql.org/docs/17/transaction-iso.html), [Sperren](https://www.postgresql.org/docs/17/explicit-locking.html) und [Constraint-Triggern](https://www.postgresql.org/docs/17/sql-createtrigger.html).
