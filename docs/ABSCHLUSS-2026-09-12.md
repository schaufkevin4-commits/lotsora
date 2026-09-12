# Abschluss des ersten Sicherheitsblocks

Stand: 12.09.2026. Umfang: die bereits begonnene Testbasis und Zugriffshärtung sauber abschließen; weitere Roadmap-Arbeit erst beim nächsten Termin. Ausgangscommit: 4c2075537e14771f627f054e14e5e8bb5a77d673 auf codex/n2-startseite-datenschutz. N1/N2 bleiben darin erhalten. Der Abschluss wird lokal im selben Branch gesichert; kein Push, Merge nach main oder Deployment gehört zu diesem Block.

## Ergebnis

| Punkt | Änderung | Nachweis |
|---|---|---|
| Testbasis | Eigene Supabase-Projektkennung lotsora-integration, API 55321, DB 55322; Migrationen aus dem Repository, synthetische Hersteller A/B und anon | Start mit den ursprünglichen 13 Migrationen; neue Sicherheitsmigration anschließend angewendet; acht Integrationstests erfolgreich |
| F01 Dateizuordnung | Dokumentpfad muss zum Produktordner passen; neue/geänderte Verweise benötigen ein vorhandenes Storage-Objekt; zusätzliche Bindung in öffentlicher Storage-Policy | Vorher konnte ein manipulierter A-Verweis die interne B-Testdatei öffentlich lesbar machen. Danach werden fremde/falsche/fehlende Pfade bei Insert und Update blockiert |
| F02 öffentlicher Pass | Separater Client ohne Cookies, Sessionpersistenz oder privilegierten Schlüssel; Seite und Metadaten lesen als anon | A/B/ausgeloggt liefern denselben veröffentlichten Pass; B erhält keinen fremden Editor-/Vorschaudatensatz |
| F04 Redirect | Normalisiertes URL-Objekt mit gleicher Origin; Steuerzeichen/Backslashes/fremde Ziele fallen auf Dashboard zurück | 19 neue Tests, einschließlich Tab/LF/CR, doppelter Slash nach Pfadnormalisierung und lokaler Port |
| F08 Teilumfang | Öffentliche Services wählen explizite Felder; Dokumentnotizen nicht mehr über anon lesbar; minimierter Pass-Datentyp | Öffentliche Rückgabe ohne interne Notizen oder separates file_path-Feld und negative API-Spaltenprüfung; Besitzer kann seine Notiz weiterhin lesen |
| DB-Typen | Aus der isolierten DB neu erzeugt und abgeglichen | Zwei schon vorhandene öffentliche SQL-Hilfsfunktionen ergänzt; keine manuell erfundenen Schemafelder |

## Prüfungen und Grenzen

- `npm test`: 51 Tests in fünf Dateien bestanden.
- `npm run test:integration`: acht Tests gegen echtes lokales PostgreSQL, Auth, REST und Storage bestanden. Keine gemockten DB-/Storage-Antworten. Nexts Request-Cookies und `connection()` werden im Test angepasst, damit die Seitenfunktionen außerhalb des Next-Servers aufgerufen werden können. Das ist keine Browser-Endabnahme.
- `npm run lint` und `npx tsc --noEmit`: bestanden.
- `npm run build`: vollständiger Produktionsbuild bestanden. Der erste Versuch im eingeschränkten Netzwerk scheiterte beim Google-Fonts-Abruf; mit Netzwerkzugriff war der Build erfolgreich. Die bestehende middleware-Deprecation bleibt offen für N9.
- Die neue Migration `20260910200000_dokument_dateizuordnung.sql` ist in der isolierten DB verzeichnet. Der Aufräumcheck ergab null Testkonten, Produkte, Dokumente und Storage-Objekte. Reservierte öffentliche IDs bleiben absichtlich erhalten.
- Die Migration verändert keine fachlichen Produktspalten. Sie validiert vorhandene Pfade; unpassende Altpfade würden die Migration abbrechen lassen, statt heimlich gelöscht oder umgehängt zu werden. Vor Übernahme in einen anderen Datenbestand ist dieser lesend zu prüfen.

Die Migration wurde bisher **nur auf die isolierte Testinstanz** angewendet. Die vorhandene Entwicklungsinstanz lotsora und die Cloud wurden nicht migriert. Die DB-Schutzregeln gelten dort erst nach bewusster Übernahme der Migration. Ein Build oder dieser Abschluss ist keine Livegang-Freigabe.

Nicht geprüft bzw. weiterhin offen: reale Browserabläufe einschließlich Passwort-Reset, vollständiger N1-ID-Garantietest, Gültigkeit bereits ausgestellter signierter Links nach Rücknahme, gesamter Cache-/Lösch-/Upload-/Autosaveablauf sowie Restore und Monitoring. F08 ist nur hinsichtlich der öffentlichen Rückgabetypen und Dokumentnotizen bearbeitet; Änderungsdatum, Feldlistenabgleich und restliche tabellenweiten Detail-Grants bleiben im Gate-Paket.

## Wiederaufnahme und Integration

Die Testumgebung ist unter `.local-tests/integration` erzeugt und von Git ausgeschlossen. Die Startkonfiguration liegt in tests/integration/supabase.config.toml. Testschlüssel werden vom lokalen CLI gelesen und ausschließlich an den Testprozess übergeben; `.env.local` ist keine Testquelle.

```text
npm run test:integration:start
npm run test:integration:migrate
npm run test:integration
npm run test:integration:stop
```

`migrate` ergänzt ausschließlich die Testinstanz; `stop` erhält deren Volumes. Die Testinstanz wurde nach den Abschlussprüfungen erfolgreich gestoppt. Das bestehende Entwicklungsprojekt bleibt unberührt.

Integrationsweg: den geprüften lokalen Commit einschließlich der neuen Migration später im bisherigen N1/N2-Branch weiterführen. Vor Merge/Push den dann aktuellen Remote- und Deploymentzustand prüfen, vor DB-Übernahme vorhandene Dokumentpfade kontrollieren. Keine automatische Cloud-Migration und kein Push als Nebenwirkung dieser Sitzung.

## Nächster begrenzter Bauauftrag: B4 / F03

Veröffentlichungsregeln müssen bei direktem API-Schreiben ebenso gelten wie bei `save_product` und `replace_product_materials`. Als Erstes deren erlaubte Schreibwege und die negativen Testfälle festlegen: leere Pflichtfelder bei veröffentlichten Produkten, Materialsumme nach DB-Rundung über 100, alternative direkte Writes sowie konkurrierendes Speichern/Veröffentlichen. Ein produktbezogener Konfliktschutz und atomare Prüfung/Veröffentlichung sind gemeinsam zu entwerfen. Weniger als 100 bleibt gemäß PP-012 ein Hinweis.

Danach folgt die bestehende Reihenfolge im [Arbeitsplan](ROADMAP.md). In diesem Abschluss wurden B4, zusätzliche Features und die spätere Template-/Import-/KI-Architektur nicht begonnen. Das lokale Phase-5-Gate bleibt offen; eine Gate-Abnahme erfordert weiterhin die vereinbarten restlichen Punkte.
