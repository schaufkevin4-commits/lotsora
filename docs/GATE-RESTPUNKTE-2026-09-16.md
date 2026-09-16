# Noch offen bis zum lokalen Gate „MVP funktional vollständig“

Stand: 16.09.2026. N1/N2, Sicherheitsblock, B4, B3 und B5/N7 sind implementiert und lokal geprüft. B5/N7 liegt im Commit `1a19141`; Kevin hat anschließend die Übernahme und den Push nach main beauftragt. Der Code-Push ist keine Datenbankmigration oder Gate-Freigabe.

N9/F07 ist lokal umgesetzt und geprüft: bestätigtes Autosave, Materialentfernung, Navigationsschutz, Versionsvergleich und koordinierte Veröffentlichung sowie PP-018/019-Abgleich. 75 Unit- und 78 Integrationstests, Lint, Typen, Build und gezielte sichtbare Browserprüfungen bestanden. Siehe [N9-Abschluss](ABSCHLUSS-2026-09-16-N9.md). Neue Migration nur in `lotsora-integration`; kein Push. **Nach N9 Pause; nächster Baublock erst nach neuem Auftrag: N3.** Die Entscheidung über getrennte Veröffentlichungsstände und das Gesamt-Gate bleiben offen.

## Verbleibende Reihenfolge

| Block | Was noch erledigt werden muss | Abnahme |
|---|---|---|
| 1. N9/F07 und Editorablauf – lokal abgeschlossen | Autosave auf tatsächlich bestätigte Daten beziehen; entfernte Materialzeilen zuverlässig speichern; ungespeicherte Änderungen bei Navigation schützen; Veröffentlichung mit laufenden Saves koordinieren; Checkliste und Datenlücken gegen PP-018/019 prüfen | Langsame/fehlgeschlagene Saves, reine Zeilenentfernung, Navigation, zwei Tabs und Veröffentlichung während des Speicherns verlieren keine Änderungen unbemerkt; verständliche Fehler und Wiederholung |
| 2. N3 – Pass, Cache und Dateilinks | Doppelte Passladung für Seite/Metadaten vermeiden; Aktualisierung und Cachefristen festlegen; abgelaufene Bild-/Dokumentlinks erneuern | Änderungen, Rücknahme und Wiederveröffentlichung innerhalb definierter Grenzen; gleicher erlaubter Inhalt für Hersteller A, B und ausgeloggt; kontrollierter DB-Ausfall |
| 3. N8, QR und proxy | Eindeutige Feld-IDs, Tastaturbedienung, Fokus, Kontrast, kleine Bildschirme und Zoom prüfen; QR-Rand auf vier Module sichern; veraltete middleware-Konvention migrieren | Dokumentierter Grundtest bei 320/375 px, Tastatur und Screenreader-Stichprobe; SVG/PNG dekodierbar; Anmeldung und Routenschutz unverändert wirksam. Physischer Druck-/Handyscan spätestens vor Kundeneinsatz |
| 4. Begrenzte Architekturgrundlagen | Kennungen für Templates/Felder, Quellenbezug, Herstellergrenze, Veröffentlichungsrevision und Produktidentität als konkrete Entwürfe festhalten | Erweiterungspunkte und späteste Umsetzungszeitpunkte dokumentiert; keine vollständige Template-, Import- oder KI-Engine als zusätzliche Gate-Bedingung |
| 5. Lokaler Systemcheck und Freigabevorlage | Gesamtstand mit passendem Schema und Konfiguration prüfen; vollständigen Produkt→Datei→Pass→QR-Ablauf durchlaufen; Befunde F01–F08 abschließend einordnen | Hersteller A/B/anon, IDs, Rechte, Speichern/Rollback, Löschung und Fehlerfälle geprüft; Tests/Lint/Typen/Build erfolgreich; offene MUSS-Punkte erledigt oder ausdrücklich entschieden; dokumentierte Vorlage für Kevins Gate-Freigabe |

Aus den bisherigen Blockspannen ergibt sich rechnerisch ein Rest von **16–30 Stunden**. Das ist ein grober Planungsrahmen, keine neue belastbare Aufwandsschätzung oder Terminzusage.

Die Abnahmeumgebung muss die Migrationen und Konfiguration des geprüften Codes enthalten. Aktuell wurden die 20 Migrationen nur auf `lotsora-integration` angewendet. Vor Übernahme in eine andere Umgebung sind vorhandene Dateien/Bildwerte/Artikelnummern zu prüfen und der ausschließlich serverseitige Upload-Verifier-Schlüssel zu konfigurieren; Details stehen im B5/N7-Abschluss.

## Danach und vor Livegang

Nach ausdrücklicher lokaler Gate-Freigabe folgen die bestehenden Lerntage 28–30: realistische Textilfälle, automatisierte Regression/CI und fachliche MVP-Abnahme. Der letzte abgeschlossene Lerntag bleibt 27/40.

Vor öffentlichem Livegang bleiben separat: N4 Cloud-/Hosting-Rollout einschließlich realer Uploadtests, N5 Backup und geprobte Wiederherstellung, N6 Monitoring/Alarmweg sowie Betreiberangaben, Datenschutz, Domain/HTTPS und die ausdrückliche Livegang-Freigabe.
