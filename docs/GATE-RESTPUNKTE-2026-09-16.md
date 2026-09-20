# Noch offen bis zum lokalen Gate „MVP funktional vollständig“

**Historische Liste – ersetzt am 20.09.2026:** Die eine gültige Restpunkteliste ist jetzt [RESTPUNKTE-GATE-2026-09-20.md](RESTPUNKTE-GATE-2026-09-20.md). **Gate geschlossen bis zu Kevins ausdrücklicher Abnahme.** Die folgenden Einträge bleiben als Historie erhalten; insbesondere ersetzt die frühere gebündelte Sprachausgabe-Bestätigung nicht die im neuen Auftrag verlangte echte Screenreader-Stichprobe.

**Restabnahme bestätigt, 20.09.:** Neue PNG-/SVG-Dateien unabhängig erfolgreich dekodiert. Kevin bestätigt Zoom-/Sprachausgabe-Stichprobe und Handyscan vom Bildschirm auch bei 200 %. [Protokoll](N8-RESTABNAHME-2026-09-20.md). Verbleibend: ausdrückliche lokale Gate-Entscheidung; physischer Ausdruckscan in festgelegter Etikettengröße spätestens vor Kundeneinsatz (aktuell kein Drucker). Frühere Warteangaben zu Downloads/Zoom/Sprachausgabe sind historisch. Kein Push/Cloud-Rollout/Livegang freigegeben.

**Gesamtsystemcheck 20.09. abgeschlossen, manuelle Restnachweise offen:** Automatisierte Prüfungen (113 Unit/96 Integration/11 Produktions-HTTP, Lint/Typen/Build), echte lokale Auth-Mails, N1-ID-Garantien und sichtbarer Team-/Produkt-/Datei-/Pass-/Löschablauf bestanden. [Prüfbericht](SYSTEMCHECK-2026-09-20.md). Offen: neues QR-Exportpaar unabhängig dekodieren, echte Screenreader-Stichprobe, öffentlicher nativer 200-%-Zoom und physischer Druck-/Handyscan (spätestens vor Kundeneinsatz). Danach Kevins ausdrückliche Gate-Entscheidung. Die ältere Ankündigung des Gesamtchecks unten ist damit historisch; kein neues Funktionspaket nötig, solange die Restabnahme keinen Defekt findet.

**Fortschritt 20.09.:** Der Team-Baublock ist lokal umgesetzt und geprüft; [Abschluss mit Tests und Live-Browsernachweis](ABSCHLUSS-2026-09-20-FIRMENTEAMS.md). 22 Migrationen nur in `lotsora-integration`. Als Nächstes folgen der zusammenhängende Gesamtsystemcheck auf dem Teammodell und die verbleibende manuelle N8-Abnahme. Gesamt-Gate und Cloud-Rollout weiterhin offen; ältere Standangaben unten sind historisch.

**Beschluss 20.09.:** Richtungen A1–A5 angenommen. Kevin hat zusätzlich mehrere Benutzer pro Firma bereits für V1 verlangt; damit ist der Team-Baublock ein ausdrücklich beauftragter neuer V1-MUSS-Punkt. Die frühere Verschiebung ist aufgehoben. [Beschluss und Abnahmekriterien](ARCHITEKTURBESCHLUSS-2026-09-20.md). Zuerst gemeinsame Firmenzugänge umsetzen/prüfen, anschließend das erweiterte V1-Gesamtgate bewerten; N8-Restnachweise bleiben offen.

Architekturstand 19.09.: Die fünf begrenzten Entwürfe liegen in der [Architekturvorlage A1–A5](ARCHITEKTURVORLAGE-2026-09-19.md) vor. Der Dokumentationsanteil von Block 4 ist ausgearbeitet; Kevins fachliche Richtungsentscheidungen bleiben offen. Kein neuer Implementierungsumfang als Gate-Bedingung eingeführt.

Nachtrag 19.09.: Tatsächliche PNG-/SVG-Browserdownloads unabhängig zur erwarteten Pass-URL dekodiert; Dateinachweis bestanden. Kevin bestätigte 200-%-Browserzoom; im Serverprotokoll sind Editor und interne Passvorschau belegt. Separater öffentlicher `/p/`-Zoomnachweis, echte Screenreader-Sprachausgabe und physische Druck-/Handyscan-Abnahme bleiben offen. [N8-Restabnahme und reproduzierbare Dateiprüfung](N8-RESTABNAHME-2026-09-19.md).

Tagesabschluss 18.09.: N3/N8-Code in `9d4ad38` committed; main-Push ausdrücklich beauftragt. [Übergabe und Einstieg morgen](TAGESABSCHLUSS-2026-09-18.md). N8-Restabnahme, Architekturentscheidungen und Gesamt-Gate bleiben offen. Ältere Angaben zum uncommitteten Stand sind historisch.

Stand: 16.09.2026. N1/N2, Sicherheitsblock, B4, B3 und B5/N7 sind implementiert und lokal geprüft. B5/N7 liegt im Commit `1a19141`; Kevin hat anschließend die Übernahme und den Push nach main beauftragt. Der Code-Push ist keine Datenbankmigration oder Gate-Freigabe.

N9/F07 ist lokal umgesetzt und geprüft: bestätigtes Autosave, Materialentfernung, Navigationsschutz, Versionsvergleich und koordinierte Veröffentlichung sowie PP-018/019-Abgleich. 75 Unit- und 78 Integrationstests, Lint, Typen, Build und gezielte sichtbare Browserprüfungen bestanden. Siehe [N9-Abschluss](ABSCHLUSS-2026-09-16-N9.md). Neue Migration nur in `lotsora-integration`. Kevin hat anschließend die Übernahme von N9-Commit `b96b7c9` und den Push nach main ausdrücklich beauftragt; siehe Tagesabschluss vom 16.09. **Nach N9 Pause; nächster Baublock erst nach neuem Auftrag: N3.** Die Entscheidung über getrennte Veröffentlichungsstände und das Gesamt-Gate bleiben offen.

## Verbleibende Reihenfolge

Aktualisierung 18.09.: **N3 im beschriebenen V1-Umfang lokal abgeschlossen**, noch uncommitted. Siehe [N3-Abschluss](ABSCHLUSS-2026-09-18-N3.md) für Aktualität, Linkrestgültigkeit, laufende Lesungen und verbliebene fachliche Entscheidungen. N8/QR/proxy inzwischen lokal umgesetzt und geprüft; manuelle Restabnahme offen. Siehe [N8-Abschluss](ABSCHLUSS-2026-09-18-N8.md). Weitere Arbeit nur nach neuem Auftrag.

| Block | Was noch erledigt werden muss | Abnahme |
|---|---|---|
| 1. N9/F07 und Editorablauf – lokal abgeschlossen | Autosave auf tatsächlich bestätigte Daten beziehen; entfernte Materialzeilen zuverlässig speichern; ungespeicherte Änderungen bei Navigation schützen; Veröffentlichung mit laufenden Saves koordinieren; Checkliste und Datenlücken gegen PP-018/019 prüfen | Langsame/fehlgeschlagene Saves, reine Zeilenentfernung, Navigation, zwei Tabs und Veröffentlichung während des Speicherns verlieren keine Änderungen unbemerkt; verständliche Fehler und Wiederholung |
| 2. N3 – lokal abgeschlossen | Geteilte Ladung pro Anfrage; aktuelle Daten bei neuem Abruf; erneuerbare Dateieinstiege mit Freigabeprüfung; explizite öffentliche Detailrechte | 93 Unit-, 85 Integrations- und sieben separate HTTP-Tests; Browserfehler/Wiederholung geprüft. Kein sofortiger Tokenwiderruf, kein automatisches Aktualisieren offener Seiten oder atomarer DB-Lesesnapshot |
| 3. N8, QR und proxy – lokal umgesetzt; manuelle Restabnahme offen | Eindeutige Feld-IDs, Tastaturbedienung, Fokus, Kontrast, kleine Bildschirme und Zoom prüfen; QR-Rand auf vier Module sichern; veraltete middleware-Konvention migrieren | Dokumentierter Grundtest bei 320/375 px, Tastatur und Screenreader-Stichprobe; SVG/PNG dekodierbar; Anmeldung und Routenschutz unverändert wirksam. Physischer Druck-/Handyscan spätestens vor Kundeneinsatz |
| 4. Begrenzte Architekturgrundlagen – Richtungen beschlossen 20.09. | Vorlage ausgearbeitet und im beschriebenen Umfang angenommen; A3 um gemeinsame Firmenzugänge bereits in V1 erweitert | Beschluss dokumentiert; keine vollständige Template-, Import- oder KI-Engine als zusätzliche Gate-Bedingung |
| 4a. Gemeinsame Firmenzugänge – lokal umgesetzt/geprüft 20.09. | Mehrere eigene Logins je Firma, Mitgliedschaften, Einladungen und vollständige Rechte-/Dateivorgangsprüfung | Zwei Mitglieder A1/A2, fremde Firma B und anon; Entzug, Einladung, letzter Verantwortlicher, Kontoentfernung und bestehende Save-/Upload-/Löschregressionen bestanden. Live-Beitritt und gemeinsame Bearbeitung gezeigt; echter Auth-Mailablauf im Gesamtcheck |
| 5. Lokaler Systemcheck und Freigabevorlage | Gesamtstand mit passendem Schema und Konfiguration prüfen; vollständigen Produkt→Datei→Pass→QR-Ablauf durchlaufen; Befunde F01–F08 abschließend einordnen | Hersteller A/B/anon, IDs, Rechte, Speichern/Rollback, Löschung und Fehlerfälle geprüft; Tests/Lint/Typen/Build erfolgreich; offene MUSS-Punkte erledigt oder ausdrücklich entschieden; dokumentierte Vorlage für Kevins Gate-Freigabe |

Die vor N3 genannten **16–30 Stunden** waren ein grober damaliger Planungsrahmen. Nach N3 wurde keine neue belastbare Restaufwandsschätzung erstellt.

Die Abnahmeumgebung muss die Migrationen und Konfiguration des geprüften Codes enthalten. Seit N3 wurden 21 Migrationen nur auf `lotsora-integration` angewendet. Vor Übernahme in eine andere Umgebung sind vorhandene Dateien/Bildwerte/Artikelnummern zu prüfen und der ausschließlich serverseitige Upload-Verifier-Schlüssel zu konfigurieren; Details stehen im B5/N7-Abschluss.

## Danach und vor Livegang

Nach ausdrücklicher lokaler Gate-Freigabe folgen die bestehenden Lerntage 28–30: realistische Textilfälle, automatisierte Regression/CI und fachliche MVP-Abnahme. Der letzte abgeschlossene Lerntag bleibt 27/40.

Vor öffentlichem Livegang bleiben separat: N4 Cloud-/Hosting-Rollout einschließlich realer Uploadtests, N5 Backup und geprobte Wiederherstellung, N6 Monitoring/Alarmweg sowie Betreiberangaben, Datenschutz, Domain/HTTPS und die ausdrückliche Livegang-Freigabe.
