# Noch offen bis zum lokalen Gate „MVP funktional vollständig“

Stand: 16.09.2026. N1/N2, Sicherheitsblock, B4, B3 und B5/N7 sind implementiert und lokal geprüft. B5/N7 liegt im Commit `1a19141`; Kevin hat anschließend die Übernahme und den Push nach main beauftragt. Der Code-Push ist keine Datenbankmigration oder Gate-Freigabe.

N9/F07 ist lokal umgesetzt und geprüft: bestätigtes Autosave, Materialentfernung, Navigationsschutz, Versionsvergleich und koordinierte Veröffentlichung sowie PP-018/019-Abgleich. 75 Unit- und 78 Integrationstests, Lint, Typen, Build und gezielte sichtbare Browserprüfungen bestanden. Siehe [N9-Abschluss](ABSCHLUSS-2026-09-16-N9.md). Neue Migration nur in `lotsora-integration`. Kevin hat anschließend die Übernahme von N9-Commit `b96b7c9` und den Push nach main ausdrücklich beauftragt; siehe Tagesabschluss vom 16.09. **Nach N9 Pause; nächster Baublock erst nach neuem Auftrag: N3.** Die Entscheidung über getrennte Veröffentlichungsstände und das Gesamt-Gate bleiben offen.

## Verbleibende Reihenfolge

Aktualisierung 18.09.: **N3 im beschriebenen V1-Umfang lokal abgeschlossen**, noch uncommitted. Siehe [N3-Abschluss](ABSCHLUSS-2026-09-18-N3.md) für Aktualität, Linkrestgültigkeit, laufende Lesungen und verbliebene fachliche Entscheidungen. N8/QR/proxy inzwischen lokal umgesetzt und geprüft; manuelle Restabnahme offen. Siehe [N8-Abschluss](ABSCHLUSS-2026-09-18-N8.md). Weitere Arbeit nur nach neuem Auftrag.

| Block | Was noch erledigt werden muss | Abnahme |
|---|---|---|
| 1. N9/F07 und Editorablauf – lokal abgeschlossen | Autosave auf tatsächlich bestätigte Daten beziehen; entfernte Materialzeilen zuverlässig speichern; ungespeicherte Änderungen bei Navigation schützen; Veröffentlichung mit laufenden Saves koordinieren; Checkliste und Datenlücken gegen PP-018/019 prüfen | Langsame/fehlgeschlagene Saves, reine Zeilenentfernung, Navigation, zwei Tabs und Veröffentlichung während des Speicherns verlieren keine Änderungen unbemerkt; verständliche Fehler und Wiederholung |
| 2. N3 – lokal abgeschlossen | Geteilte Ladung pro Anfrage; aktuelle Daten bei neuem Abruf; erneuerbare Dateieinstiege mit Freigabeprüfung; explizite öffentliche Detailrechte | 93 Unit-, 85 Integrations- und sieben separate HTTP-Tests; Browserfehler/Wiederholung geprüft. Kein sofortiger Tokenwiderruf, kein automatisches Aktualisieren offener Seiten oder atomarer DB-Lesesnapshot |
| 3. N8, QR und proxy – lokal umgesetzt; manuelle Restabnahme offen | Eindeutige Feld-IDs, Tastaturbedienung, Fokus, Kontrast, kleine Bildschirme und Zoom prüfen; QR-Rand auf vier Module sichern; veraltete middleware-Konvention migrieren | Dokumentierter Grundtest bei 320/375 px, Tastatur und Screenreader-Stichprobe; SVG/PNG dekodierbar; Anmeldung und Routenschutz unverändert wirksam. Physischer Druck-/Handyscan spätestens vor Kundeneinsatz |
| 4. Begrenzte Architekturgrundlagen | Kennungen für Templates/Felder, Quellenbezug, Herstellergrenze, Veröffentlichungsrevision und Produktidentität als konkrete Entwürfe festhalten | Erweiterungspunkte und späteste Umsetzungszeitpunkte dokumentiert; keine vollständige Template-, Import- oder KI-Engine als zusätzliche Gate-Bedingung |
| 5. Lokaler Systemcheck und Freigabevorlage | Gesamtstand mit passendem Schema und Konfiguration prüfen; vollständigen Produkt→Datei→Pass→QR-Ablauf durchlaufen; Befunde F01–F08 abschließend einordnen | Hersteller A/B/anon, IDs, Rechte, Speichern/Rollback, Löschung und Fehlerfälle geprüft; Tests/Lint/Typen/Build erfolgreich; offene MUSS-Punkte erledigt oder ausdrücklich entschieden; dokumentierte Vorlage für Kevins Gate-Freigabe |

Die vor N3 genannten **16–30 Stunden** waren ein grober damaliger Planungsrahmen. Nach N3 wurde keine neue belastbare Restaufwandsschätzung erstellt.

Die Abnahmeumgebung muss die Migrationen und Konfiguration des geprüften Codes enthalten. Seit N3 wurden 21 Migrationen nur auf `lotsora-integration` angewendet. Vor Übernahme in eine andere Umgebung sind vorhandene Dateien/Bildwerte/Artikelnummern zu prüfen und der ausschließlich serverseitige Upload-Verifier-Schlüssel zu konfigurieren; Details stehen im B5/N7-Abschluss.

## Danach und vor Livegang

Nach ausdrücklicher lokaler Gate-Freigabe folgen die bestehenden Lerntage 28–30: realistische Textilfälle, automatisierte Regression/CI und fachliche MVP-Abnahme. Der letzte abgeschlossene Lerntag bleibt 27/40.

Vor öffentlichem Livegang bleiben separat: N4 Cloud-/Hosting-Rollout einschließlich realer Uploadtests, N5 Backup und geprobte Wiederherstellung, N6 Monitoring/Alarmweg sowie Betreiberangaben, Datenschutz, Domain/HTTPS und die ausdrückliche Livegang-Freigabe.
