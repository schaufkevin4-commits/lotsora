# Lotsora: Produktrichtung und Entscheidungsstand

Stand: 10.09.2026. Quelle der ergänzten Richtung: Kevins Analyseauftrag vom 10.09.2026. Technische Empfehlungen sind im [Analysebericht](ANALYSE-2026-09-10.md) begründet; Ausführung gemäß [Arbeitsplan](ROADMAP.md) erst nach Freigabe.

Fortschritt vom 12.09.2026: Der Einstieg wurde inzwischen freigegeben und der erste Sicherheitsblock ist lokal implementiert und geprüft ([Abschlussprotokoll](ABSCHLUSS-2026-09-12.md)). Die hier aufgeführten weitergehenden Architekturentscheidungen bleiben Vorschläge, soweit nicht ausdrücklich anders beschlossen.

Die bestehende zentrale PP-Historie liegt in [Brain-KI / PassPilot / ENTSCHEIDUNGEN.md][entscheidungen]. Dieses Dokument ist eine nachvollziehbare Ergänzung im Codeprojekt. Es vergibt keine neue offizielle PP-Nummer und schreibt historische Beschlüsse nicht um. Insbesondere wird der andernorts vorgemerkte PP-023-Kandidat zur Offline-Strategie hier nicht anderweitig verwendet.

## Entscheidungen: bestehend und weiterhin gültig

| Beschluss | Datum/Bezug | Weiterhin gültig |
|---|---|---|
| PP-002 / PP-004 / PP-006 / PP-007 | 05.06.2026 | Textil/Apparel zuerst, kleines MVP, modular erweiterbar, einfache KMU-SaaS |
| PP-005 | 05.06.2026 | Keine unbegründeten Compliance-/Rechtsversprechen |
| PP-009 | 26.06., ergänzt 13.08.2026 | Lotsora nach außen; PassPilot bleibt interner Codename und PP-Namensraum |
| PP-010 | 01.07.2026 | Eigener Textilbereich; Farbe/Größe optional, Varianten später; Produktname/Beschreibung/Kategorie/Status Pflicht, Identifikationsfelder optional; Änderungsdatum MUSS-light, volle Versionierung SOLL |
| PP-011 / PP-012 | 02.07., PP-012 ergänzt 09.08.2026 | Veröffentlichung aktiv durch Hersteller; kein stiller Statusrücksprung; Pflichtfelder veröffentlichter Produkte erhalten; Materialsumme >100 gesperrt, <100 Warnung |
| PP-013 | 04.07.2026 | Feste öffentliche Feldliste/Sektionsreihenfolge; leere optionale Felder ausblenden; interne Datenlückenhinweise, explizite Dokumentfreigabe, Disclaimer |
| PP-014 / PP-015 | 08./09.07.2026 | Next.js, Tailwind/shadcn, Supabase/PostgreSQL/Auth/Storage, gemeinsame Codebasis |
| PP-016, insbesondere E6 | 13.07., ergänzt 03.09.2026 | Eigene dauerhafte Domain, 12-stellige Base58-public_id, serverseitig erzeugt, unveränderlich und nie wiederverwendet |
| PP-017 | 07.08.2026 | Gemeinsame DB mit RLS und Herstellertrennung; komplexe Rollen bleiben außerhalb V1 |
| PP-018–020 | 08.–10.08.2026 | Einfache Navigation, Onboarding, geführtes Erstanlegen/freies Bearbeiten, Autosave plus Knopf, Vorschau, mobile öffentliche Seite |
| PP-021 / PP-022 | 12./13.08.2026 | TypeScript, Services, migrationsbasiertes Schema, Supabase-Client mit generierten Typen; lokal entwickeln/testen, Cloud separat |
| Offline-/Gate-Aufteilung | 03.09.2026, Präzisierung LP-002 | Lokal weiterbauen; lokales Phase-5-Gate und öffentlicher Livegang getrennt |

Anbieterregionen Frankfurt bleiben dokumentierte Vorgaben; ihre tatsächliche Cloud-Konfiguration wurde in dieser Analyse nicht neu geprüft. Frühere Aussagen zu rechtlicher Eignung von Anbietern werden hier nicht als neue Rechtsbewertung übernommen.

## Entscheidungen: vom Nutzer am 10.09.2026 für die Planung gesetzt

Lotsora soll langfristig eine einfach bedienbare, KI-gestützte Produktdatenplattform werden. Der digitale Produktpass ist ein wichtiges Ergebnis dieser Plattform; weitere Nutzungen bestätigter Produktinformationen dürfen später hinzukommen.

Das Zielbild lautet: **Daten und Dokumente bereitstellen → Lotsora bereitet Angaben vor → Nutzer prüft → Nutzer veröffentlicht.** Weniger doppelte Eingabe ist ein Kernziel. Das bestehende Projekt wird weiterentwickelt, nicht neu begonnen.

Verantwortung bleibt beim Hersteller bzw. verantwortlichen Kunden. Import und KI dürfen lesen, zuordnen, Vorschläge machen und auf Lücken/Widersprüche hinweisen. Sie bestätigen keine fachliche Richtigkeit und veröffentlichen keine Angaben eigenständig. Ein vom Nutzer bestätigter Wert ist keine Lotsora-Zertifizierung.

Textil/Apparel bleibt die erste tatsächlich unterstützte Branche. Weitere Branchen, Datenquellen und Integrationen müssen später ergänzbar sein; sie werden nicht gleichzeitig in V1 gebaut. Ein Unternehmen darf perspektivisch Produkte verschiedener Gruppen führen. Die technische Empfehlung dafür ist eine Vorlage pro Produkt; ihre Umsetzung bleibt zur Freigabe offen.

Einfachheit und geringe Eingabelast sind verbindliche Produktziele. Zukunftsfähigkeit rechtfertigt gezielte Grundlagen, keine vollständige Engine für hypothetische Fälle. Bestehende Gate-Kriterien haben weiterhin Vorrang.

## Änderungseinordnung: Alt, Neu, Grund und Status

| Thema | Bisheriger Beschluss/Stand | Neue Richtung oder Empfehlung | Grund / Bezug | Status |
|---|---|---|---|---|
| Plattformnutzen | Vision 05.06.: strukturierte Produktinformationen/DPP; KI später | KI-gestützte Produktdatenplattform, DPP als ein Ergebnis | Auftrag 10.09.: weniger doppelte Datenpflege | Produktrichtung gesetzt; kein neuer V1-Featureumfang |
| KI-Priorität | LP-002 vom 08.09.: optional später, kein nächster Bau-/Gatepunkt | Langfristig wichtiger Assistent; gegenwärtig weiterhin keine KI-Implementierung | Auftrag 10.09. und bestehendes Gate | Ergänzung der Vision, keine Aufhebung der Gate-Grenze |
| Feldstruktur | DATENMODELL/TECHNIK: dynamische Metadaten später; keine komplexe Engine im MVP | Kennungen/Versionsvertrag früh; kleiner Textilkatalog statt Engine | Späteren Import-/Quellenumbau begrenzen | Technische Empfehlung, Freigabe offen |
| Öffentlicher Datenstand | Code liest laufend aktuelle Tabellen; volle Versionierung laut PP-010 SOLL | Bearbeitungsstand von freigegebener Revision trennen | Kontrollierte Imports/Templateupdates dürfen nicht ungeprüft live gehen | Bewusste Änderung der Semantik; vor Umsetzung gesondert entscheiden |
| Firmen-/Nutzerbezug | Bau-Tag 19: genau ein Login pro Hersteller; PP-017 Rollen später | Spätere Mitgliedschaften, stabile Herstelleridentität unabhängig vom Login | Multi-User/Multi-Company ermöglichen | Nur Vorbereitung empfohlen; heutige Einschränkung bleibt bis Migration |
| Backendbeschreibung | PP-014/021 nennen API Routes | Bestehende Server Actions als Transport dokumentieren, Services/DB-Regeln beibehalten | Abgleich mit tatsächlichem Code | Dokumentationspräzisierung empfohlen, kein REST-Neubau |

Keine Tabelle oben erteilt automatisch die Freigabe, das Produktmodell oder Veröffentlichungsverhalten zu ändern. Bei einem späteren Beschluss in Brain-KI Altentscheidung, neue Entscheidung, Grund, Datum und konkrete Reichweite übernehmen; Historie erhalten.

## Learnings aus der Analyse

- Vorhandene Tabellen und Services tragen eine schrittweise Erweiterung. „Noch kein Template-System“ ist kein Beweis für eine falsche Grundarchitektur.
- RLS muss gemeinsam mit Spaltenrechten, Rollen und referenzierten Storage-Objekten geprüft werden. Ein grüner Eigentümerbrowser und 32 Unit-Tests reichen dafür nicht.
- Ein atomarer Save verhindert Teilwrites, aber keine unzulässige direkte API-Mutation, keinen veralteten Editorstand und keine falsche Freigabe.
- Heute ist der Produktpass eine aktuelle Sicht auf Produktdaten. Ein Änderungsdatum ist weder Versionshistorie noch Nachweis menschlicher Bestätigung.
- Dokument-ID und Dateipfad reichen nicht als dauerhafte Quellenversion. Material-IDs aus Replace-all sind ungeeignet für unveränderliche Feldbelege.
- Herkunft, Prüfung, Aktualität und Veröffentlichung sind unterschiedliche Zustände; sie sollten nicht in einem großen Statusfeld vermischt werden.
- N1/N2 sind gepusht, aber nicht in main integriert. Dokumentierte Altstände und tatsächliche Branchzustände müssen unterschieden werden.

Diese Erkenntnisse sind lokale Analyseergebnisse. Bestehende L-xxx-Learnings in Brain-KI bleiben erhalten; es wurden dort keine neuen Einträge veröffentlicht.

## Ideen / Backlog mit klaren Auslösern

| Idee | Früheste sinnvolle Voraussetzung |
|---|---|
| CSV/XLSX mit Mapping, Vorschau, Wiederimport und Quellenbezug | Stabiler Kern, freigegebene Musterdateien, klare Produktzuordnung |
| PDF-Datenübernahme; später DOCX, Scans/OCR und weitere Dokumente | Ausgewählte reale Dokumenttypen, unveränderliche Quellversionen |
| KI-Feldvorschläge und intelligente Lücken-/Konflikthinweise | Manuelle Prüfung/Freigabe steht; nachgewiesener Mehrwert bei echten Beispielen |
| Versionierte zusätzliche Templates und Anforderungshinweise | Verantwortliche fachliche Pflege, Änderungsquelle/Geltung, kontrollierte Migration |
| Mehrere Benutzer/Brands/Firmen | Konkreter Pilotbedarf, Mitgliedschaftsmodell mit vollständig geprüfter RLS |
| Familien/Varianten/Chargen | Produktidentität und Geltungsbereich der QR-ID geklärt |
| ERP/PIM/API | Stabiler Import-/Übernahmevertrag, Authentifizierung und wiederholbare Verarbeitung |
| Lieferantenanfragen, Aufgaben, Verantwortlichkeiten | Wiederkehrender Kundenablauf mit passenden Berechtigungen |
| Öffentliche/geschützte Pässe | Separates Empfängermodell; geheime URL allein genügt nicht |
| Analytics/QR-Scans, Bulk-Import/-Bearbeitung | Konkreter Auswertungs- oder Mengennutzen; begrenzter Datenumfang |

Alle Formate teilen das Zielmodell, aber nicht denselben Parser. KI ist kein notwendiger Zwischenschritt für CSV oder einfache Prüfregeln. Interne Quelldokumente werden durch die Veröffentlichung einzelner Werte nicht automatisch öffentlich.

## Annahmen

Ein kleines Textilprofil, ein verantwortlicher Nutzer je Firma und ein zunächst manuell bedienbarer Ablauf reichen für den nächsten stabilen Kern. Diese Annahmen werden bei ersten passenden Pilotgesprächen geprüft. Die Zahl benötigter Brands, Nutzer, Varianten und Quellen ist noch nicht belegt.

Weniger Übertragungsarbeit könnte ein Wettbewerbsvorteil sein. Das ist eine zu validierende Nutzenhypothese, kein bereits bewiesenes Alleinstellungsmerkmal. Zahlungsbereitschaft, Preisstrategie und Betreuungsbedarf bleiben offen; ein größerer Funktionsumfang beantwortet diese Fragen nicht.

## Offene Fragen

1. Welche minimale Veröffentlichungsrevision wird genehmigt, und wann soll sie eingeführt werden? Welche Bestätigung ist für bestehende Altstände tatsächlich belegt?
2. Wie schnell müssen zurückgezogene Dokumente/Pässe bei neuen Abrufen verschwinden, und welche Restgültigkeit ausgegebener signierter Links ist akzeptabel?
3. Welcher Uploadweg und welche konsistente Grenze gelten für PDF und Bilder?
4. Welche Einheit bezeichnet ein Produkt/gedruckter QR: Modell, Variante oder Charge? Neue Produktion darf nicht versehentlich einen alten Gegenstand umdefinieren.
5. Welche Felder und Metadaten gehören explizit in den öffentlichen Ausschnitt? Bestehende Wasch-/Wiederverwendungsangaben mit PP-013 abgleichen.
6. Wer prüft und pflegt Templates und deren fachliche Quellen? Wer beurteilt die Geltung geänderter Anforderungen für bestehende Produkte?
7. Welche Aufbewahrungs-/Löschregeln gelten für Quellversionen, Freigaben und Dateien?
8. Welche ersten Musterdateien, Produktzuordnungen und Pilotkonstellationen rechtfertigen den Ausbau?

## UX-Leitlinie

Der Nutzer soll einfache Schritte sehen: „Dokumente hinzufügen“, „Gefundene Angaben prüfen“, „Änderungen übernehmen“, „Produktpass veröffentlichen“. Hinweise wie „Aus Datenblatt, Seite 2“ oder „Diese Angabe wurde seit Ihrer Prüfung geändert“ helfen bei einer Entscheidung. Technische Parser-/Modellstatus bleiben außerhalb des normalen Ablaufs.

„Für diese Vorlage gibt es geänderte Anforderungen“ ist ein möglicher späterer Hinweis. Er ersetzt weder fachliche Prüfung noch Nutzerfreigabe und darf keine automatische Compliance-Bestätigung auslösen. Eine neue Templateversion ändert bestehende Werte oder veröffentlichte Pässe nicht stillschweigend.

[entscheidungen]: https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/PassPilot/ENTSCHEIDUNGEN.md
