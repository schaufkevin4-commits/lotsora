# Übergabe nach dem lokalen Gate

**Aktueller Einstieg 24.09.2026:** Praktischer Lotsora-Aufbau, keine automatischen Quiz-/Lernpakete. Tag 28 Testvorbereitung abgeschlossen: sechs Produkte, zwei Firmen, sechs Rollen, 26 Soll-Szenarien; 13 Katalogprüfungen bestanden. Die 26 Abläufe wurden noch nicht ausgeführt. Fortschritt 28/40 (70 %). Nächster Schritt Tag 29: Fehleranalyse/Stabilisierung und Regression/CI; danach abgestimmtes Design, erneute UI-/QR-/Screenreader-Prüfungen und ausdrückliches Tag-30-Gate. Keine Kunden-/Cloud-Freigabe, kein Push/Deploy. Ältere Einstiegsangaben unten sind historisch.

**Tagesabschluss 22.09., nachgetragen am 23.09.2026:** Kevin hat die Übernahme und den Push des geprüften Stands nach main beauftragt. [Abschluss, Nachweise und Wiedereinstieg](TAGESABSCHLUSS-2026-09-22.md). Die sieben lokalen Arbeitscommits einschließlich P2-2/P2-3/P2-4 und gemeinsamer P2-6-Struktur werden damit gesichert; ältere Hinweise „kein Push“ unten beschreiben den Stand vor diesem Auftrag. Testreste bereinigt und isolierte Testinstanz gestoppt, kein DB-Reset/Cloud-Apply. Kevin arbeitet vorübergehend am Brain-KI-Cockpit weiter. Nächster Lotsora-Einstieg: Gesamtaufbau beurteilen, danach finale Gestaltung. Nutzer-/Kundenabnahmen und Tag 28 bleiben offen.


## Aktueller Einstieg: einheitliche Struktur und Wettbewerb

Kevins Folgeauftrag zur Konkurrenz und einheitlichen Übersicht über alle Seiten
ist lokal umgesetzt. Gemeinsame Navigation und Seitenköpfe, fokussiertes Dashboard,
Suche/Statusfilter, aufklappbare Profil-/Teamdetails, einheitliche Zugangsseiten
und Inhaltsnavigation im öffentlichen Pass. [Umfang, Wettbewerbsquellen und
Nachweise](P2-6-SEITEN-UND-WETTBEWERB-2026-09-22.md).
141 Unit- und 11 Produktions-HTTP-Tests, Lint/Typen/Build bestanden;
Desktop und 320 Pixel, Suche/Sortierung, Speicherung eingeklappter Profilfelder,
Vorschau/öffentlicher Stand und Tastatursprung geprüft.
Als Nächstes den gesamten Aufbau beurteilen, danach finale Optik abstimmen und
umsetzen. Die Wettbewerbsrichtung für kleine Textilfirmen ist eine Hypothese,
noch kein gemessener Vorteil. P2-6 bleibt offen; P2-5/Regression/Kundenabnahme folgen.
LP-002 Phase 6, 27/40, Tag 28 offen. Brain-KI synchronisieren, kein Lotsora-Push.

## Vorheriger Abschluss: P2-4

Nach „starte mit der nächsten aufgabe“ sind private Entwürfe und vollständige
öffentliche Stände getrennt. Bewusste Aktualisierung umfasst Formular, Bild,
Dokumentauswahl und Firmenangaben; bisher benötigte Dateien bleiben erhalten.
141 Unit-, 154 Integrations- und 11 HTTP-Fälle bestanden; Lint, Typen, Build
und Browservergleich vor/nach Freigabe grün.
[Umsetzung, Grenzen und nächster Einstieg](P2-4-UMSETZUNG-2026-09-22.md).
P2-3 durch Fortsetzung bestätigt; neue P2-4-Nutzerabnahme offen.
Als Nächstes P2-6: Designrichtung und übersichtlichere Darstellung vorbereiten,
danach Umsetzung über alle Seiten/Zustände; P2-5 manuell nach UI-Änderungen.
Brain-KI wird im selben Abschluss synchronisiert; Lotsora nur lokal gesichert.
LP-002 Phase 6, formal 27/40, Tag 28 offen.

## Vorheriger Abschluss: P2-3

Historischer Zwischenstand; durch den aktuellen Abschluss oben ersetzt.

Nach „passt machen wir weiter“ wurde der empfohlene Umfang umgesetzt:
Versionspflicht für Produktformular und Status, ältere direkte Schreibwege
gesperrt. 148 Unit-, 144 Integrations- und 11 HTTP-Tests grün; Typen, Lint und
Build bestätigt. Zwei Editor-Tabs zeigen den Konflikt bei erhaltener Eingabe.
[Umfang, Nachweise und Vorbereitung P2-4](P2-3-UMSETZUNG-2026-09-22.md).
P2-2 und Kontoseiten-Vereinfachung sind durch die Fortsetzungen bestätigt;
P2-3 technisch abgeschlossen, separate Nutzerabnahme dieses Stands offen.
Brain-KI wird im selben Abschluss nachgeführt; Lotsora nicht gepusht.
LP-002 Phase 6, 27/40, Tag 28 offen.

## Vorherige Fortsetzung: Passworthinweis und P2-3

Historischer Zwischenstand; durch den aktuellen Abschluss oben ersetzt.

**Neuester UI-Nachtrag:** Auf Kevins Rückmeldung zur Textmenge wurde die
Kontoverwaltung in Auswahl und gezielte Bestätigung geteilt. Datenübersicht ist
aufklappbar; endgültige Folgen und erforderliche Kontoauswahlen bleiben sichtbar.
11 Löschtests, Lint, TypeScript und Build bestanden; Desktop-/Mobil- und
Tastaturprüfung durchgeführt. [Umfang und Nachweis](KONTO-UX-2026-09-22.md).

Nach Kevins „top dann nächster schritt“ wurde der Passworthinweis in beiden
Löschformularen präzisiert und „Passwort vergessen?“ ergänzt. Gezieltes ESLint,
TypeScript und Browsernavigation zur Rücksetzseite bestanden.
Der Arbeitsfokus geht zu P2-3: [Schreibwege, konkrete Empfehlung und Prüfplan](P2-3-VORBEREITUNG-2026-09-22.md).
Die Entscheidung zum Schutz sämtlicher Schreibwege für Produktformular und
Veröffentlichungsstatus ist angefragt; noch keine DB-/RPC-Änderung für P2-3.
Brain-KI wird mit diesem Stand im selben Abschluss synchronisiert.

## Aktuelle Umsetzung am 22.09.2026

P2-2 wurde nach Kevins „machen wir so“ lokal umgesetzt und live im Browser
vorgeführt: Einladung zur bestehenden Firma oder bewusste eigene Neuanlage.
148 Unit-, 133 Integrations- und 11 HTTP-Tests, TypeScript, ESLint und Build bestanden.
[Details, Grenzen und nächste Schritte](P2-2-UMSETZUNG-2026-09-22.md).
Abschließende Nutzerabnahme der Oberfläche offen; danach P2-3-Reichweite klären.
Brain-KI wird gemäß Dauerauftrag in diesem Abschluss auf GitHub/main und lokal
nachgeführt. Lotsora-Code bleibt lokal, um keinen Vercel-Deploy auszulösen.
LP-002 Phase 6, formal 27/40; Tag 28 offen.


## Dauerauftrag und vorherige Vorbereitung am 22.09.2026

Historischer Zwischenstand vor der anschließenden P2-2-Freigabe und Umsetzung oben.

Kevin hat nach dem folgenden Abgleich ausdrücklich beauftragt:
„ab sofort soll auch die brain ki immer den aktuellen stand behalten und auch als basis gelten“.
Dies ersetzt die frühere Vorgabe, Brain-KI nur zu lesen und nicht automatisch zu
synchronisieren. Die Brain-KI ist bei jeder weiteren Lotsora-Arbeit als Grundlage
zu lesen und anhand belegter Fortschritte im selben Abschluss aktuell zu halten.
GitHub/main und die saubere lokale Brain-Kopie stehen bei
`944969fa53fd847265d65547010358bdfadbd353`.

Der Dauerauftrag ist in Brain-README und CLAUDE.md verankert; System/AKTUELL,
PassPilot/STAND, KI_Lernen/STAND, ROADMAP und LP-002 sind nachgeführt.
Geschützte Beschluss-/Learning-/Changelog-/Befehlsdateien wurden durch den neuen
Commit nicht verändert. Der lokale Fast-forward enthält zusätzlich die elf
bereits vorher auf GitHub vorhandenen Commits; das ist kein neuer fachlicher Beschluss.
Historische Brain-Abschnitte bleiben erhalten, die neueren A3-/A4-/P2-1-Beschlüsse
sind mit den Lotsora-Quellen verknüpft. Neue PP-/SE-Nummern wurden nicht erfunden.

**Nächster Schritt:** [P2-2-Entscheidungsvorlage, Nutzerablauf und Abnahmefälle](https://github.com/schaufkevin4-commits/Brain-KI/blob/944969fa53fd847265d65547010358bdfadbd353/KI_Lernen/LERNPL%C3%84NE/LP-002/PLAN.md#vorbereitung-p2-2-konten-ohne-firma-22092026).
Empfehlung: Aus einem Konto ohne Firma eine neue, leere Firma anlegen können;
gültige Einladung und persönliche Kontolöschung bleiben erhalten. Alternative:
tatsächlicher Supportkontakt plus dokumentierter Betreiberablauf.
Produktentscheidung/Implementierung sind offen, die Vorbereitung ist abgeschlossen.
Kein neuer Lerntag; formal 27/40, Tag 28 offen.

Lotsora-Code unverändert bei `305298f`; die lokalen Dokumentationsänderungen vom
Abgleich und dieser Vorbereitung sind noch nicht committed/gepusht.
Am Codecommit wurde ein erfolgreicher Vercel-Deploymentstatus festgestellt;
öffentliche Erreichbarkeit und aktueller Deployment-Schalter wurden nicht geprüft.
Keinen Lotsora-Push mit möglichem automatischem Deploy aus diesem Auftrag ableiten.
Die komplette nächste Arbeitsgrundlage liegt dauerhaft in Brain-KI/main.

## LP-002-Abgleich am 22.09.2026

Historischer Stand vor dem anschließenden Dauerauftrag oben. Die hier noch offene
Brain-Pflege und der Rückstand der lokalen Brain-Kopie sind inzwischen erledigt.

**Ergebnis:** LP-002 bleibt der einzige übergeordnete Lern- und Aufbauplan.
Lotsora steht fachlich am Einstieg in Phase 6 „Test & Stabilisierung“:
Das lokale Phase-5-Gate ist seit 20.09. freigegeben, P2-1 anschließend umgesetzt
und abgenommen. Formal dokumentiert sind weiterhin **27/40 abgeschlossene Tage
(67,5 %)**; Tag 28 ist der nächste offene Lerntag. Dieser Abgleich beginnt oder
verbucht keinen Lerntag und erteilt keine Kunden-/Cloud-Freigabe.

### Aktuell geprüfte Quellen und Grenzen

- Lotsora: GitHub-`main` und saubere lokale Arbeitskopie vor dieser Dokumentation
  identisch auf `305298f49d2f86fe53b3556e8b2672003094e55d`.
  Lokaler Arbeitsbranch: `codex/gate-restpunkte`.
- Brain-KI: GitHub-`main` aktuell bei
  `0439b2c56b296e6951f0c5f5234d4bf918dcf273`; aktueller Zugriff war möglich.
  Die saubere lokale Kopie `C:/Brain-KI` steht bei `5975954`;
  der frisch abgefragte GitHub-Vergleich bestätigt 11 fehlende Commits.
  Für diesen Abgleich wurden deshalb die GitHub-Inhalte verwendet.
- Gelesen: geltende Lotsora-`AGENTS.md`, README, Restpunkteliste, Übergabe,
  Browserabnahme, Architekturbeschluss und P2-1-Nachweis. Ergänzend statisch geprüft:
  Firmenlos-Zustand in `app/(intern)/layout.tsx`, `app/konto/page.tsx`,
  versionierte Speicherrouten und Veröffentlichungshinweise.
- Brain-Kontext: BRAIN_REGELN v4.1, LP-002/PLAN, aktuelle Abschnitte aus
  KI_Lernen/STAND, PassPilot/STAND und System/AKTUELL, PassPilot/ROADMAP;
  relevante Lernbeschlüsse E-010 bis E-014, Projektbeschlüsse zu Teamgrenzen,
  UX und lokalem Betrieb sowie Learnings L-032 bis L-035.
- Keine erneute Funktionsabnahme: Die 148 Unit-, 120 Integrations- und 11 HTTP-Tests
  sind dokumentierte Nachweise vom 20.09. in
  [P2-1](P2-1-UMSETZUNG-2026-09-20.md), keine heute neu ausgeführten Tests.
  Live-Datenbank, Hosting und Domain-Erreichbarkeit wurden hier nicht geprüft.
  Heute wurden Dokumentation, Git-Stände und ausgewählte Codepfade abgeglichen.

### Sichtbare Abweichungen zwischen Brain-KI und Lotsora

| Thema | Brain-KI bei `0439b2c` | Neuerer belegter Lotsora-Stand / Umgang |
|---|---|---|
| Lokales Gate | PLAN/STAND/AKTUELL führen Phase 5 und offenen Nachlauf | [Browserabnahme](GATE-BROWSERABNAHME-2026-09-20.md) belegt Kevins Gate-Freigabe vom 20.09.; nicht erneut öffnen |
| Nächster Arbeitsblock | Alter Bestands-/Zugriffsschutzblock auf Basis `c0ff322`/`4c20755` | Aktueller Stand `305298f`; P2-2 ist nächster offener Produktpunkt |
| Mehrere Nutzer pro Firma | PP-017/PP-020 und ältere Roadmap schieben interne Rollen/Teams auf | [A3 vom 20.09.](ARCHITEKTURBESCHLUSS-2026-09-20.md) zieht mehrere Nutzer ausdrücklich in V1 vor; bereits umgesetzt, erhalten |
| Konto-/Firmenlöschung | Neuere P2-1-Abnahme noch nicht nachgeführt | Selbstbedienung einschließlich unabhängiger Kontoauswahlen abgenommen; keine erneute Variantenentscheidung |
| Veröffentlichungsstände | Bewusste Freigabe als Ausbauziel, alte Produktlogik liest aktuelle Daten | A4 bestätigt die Richtung und Umsetzung vor kontrollierten Importen; P2-4 klärt nur Vorziehung vor ersten Kunden und konkreten Umfang |
| Lernfortschritt | Tag 27, 27/40 Tage | Bleibt korrekt als formale Abschlusszählung; Gate-Freigabe und P2-1 zählen nicht automatisch als Tag 28/29 |
| Ältere Gate-Zeilen | PLAN: Tag 17/Development-Gate offen; AKTUELL nennt Freigabe am 13.08. | Bereits innerhalb der Brain-Dokumentation widersprüchlich; keine rückwirkende Umbuchung und kein Wiederöffnen abgeschlossener Bauphasen |

Die Abweichungen werden hier sichtbar festgehalten. Kein automatischer Brain-Sync,
keine neue PP-Nummer und keine Änderung geschützter Entscheidungen, Learnings,
Historien, Changelogs oder Befehlsdateien. Bei später gesondert beauftragter
Brain-Pflege die aktiven Statusstellen gemeinsam angleichen und die Beschlusshistorie
erhalten. Die Zuordnung unten ist eine Arbeitsplanung innerhalb von LP-002,
kein neuer Lernplan und keine vorweggenommene Produktentscheidung.

### Zuordnung der offenen Arbeiten zu LP-002

| Arbeit | Einordnung im bestehenden LP-002 | Noch erforderliches Ergebnis |
|---|---|---|
| Tag 28: realistische isolierte Testdaten | Phase 6, nächster formaler Lerntag | Bestehende synthetische Fixtures nutzen; nachvollziehbare Textil-Testfälle samt Soll-Ergebnissen zusammenstellen. Firmenverantwortlicher, Mitarbeiter, fremde Firma und ausgeloggter Besucher berücksichtigen. Kundendaten nur mit Freigabe |
| P2-1: Konto-/Firmenlöschung | Bereits erledigte Ergänzung des Produktkerns; Regression in Phase 6 | Abnahme vom 20.09. erhalten; Cloud-Worker-Betrieb erst in P3 |
| P2-2: Konten ohne Firma | Phase 6, Stabilisierung für Tag 29 | Selbstbedienung freigegeben, lokal umgesetzt und geprüft; finale Nutzerabnahme offen |
| P2-3: Versionsschutz | Phase 6 / Tag 29, Datenkonsistenz | Reichweite für sämtliche API-Schreibwege entscheiden; danach konkurrierende direkte und indirekte Writes passend prüfen |
| P2-4: Veröffentlichungsstände | Phase 6, Umfang vor Kundenabnahme klären; A4 spätestens vor kontrollierten Importen | Vorziehung vor ersten Kunden entscheiden; Trennung von Bearbeitungsstand und öffentlichem Stand ist als Richtung beschlossen, noch nicht gebaut |
| P2-6: eigener Designblock | Phase-3-UX als Grundlage; Umsetzung/visuelle Abnahme innerhalb Phase 6 vor Kundentest | Richtung abstimmen, alle vereinbarten Seiten/Zustände sowie Handy/Tablet/Desktop umsetzen und live abnehmen |
| P2-5: gedruckter QR + Screenreader | Phase 6, Nachweise für Tag 30 | Gedrucktes Etikett mit Größe/Druck und echtem Telefon prüfen; Reader/Browser/Datum/Abläufe/Befunde separat dokumentieren, nach relevanten UI-Änderungen prüfen |
| Tag 29: Regression und CI | Phase 6 | Vorhandene Fach-/RLS-/Storage-/HTTP-Tests weiterverwenden und gezielt ergänzen; GitHub-Actions-Automatisierung ist im aktuellen Repository noch nicht vorhanden (`.github` fehlt) |
| Tag 30: MVP-Abnahme und Verständlichkeit | Phase 6, Gate „MVP testbereit“ | Gültige Kriterien und durchgängige Abläufe einschließlich P2 prüfen; offene Punkte ausdrücklich entscheiden, eigene Kundenfreigabe einholen |
| P3-1 bis P3-5 und B1 | Vor-Livegang-Paket N4/N5/N6, getrennt von lokalem Phase-6-Gate | Leere Instanz/Voll-Apply, Hostingheader, Tokenlogs, Auth/Mail/Domain/HTTPS, Restore/Monitoring und überwachter Löschworker; P3-4 bleibt optional, B1 unbewiesener Verdacht |
| Gespräche, Nutzen, Preis und Pilotumfang | Phase 7, Tage 31–34 | Nach vorzeigbarem Kern echte Textilabläufe und Zahlungsbereitschaft validieren; keine Gespräche oder Ergebnisse als erfolgt verbuchen |
| Marktauftritt, Vertrieb, Zahlung | Phasen 8–9, Tage 35–40 | Spätere Planabschnitte; keine Vorziehung von Landingpage, Stripe, Analytics oder KI in den jetzigen Block |

Das Vor-Livegang-Paket hat keinen neu erfundenen Lerntag: Es ist bereits in LP-002
gesondert beschrieben und wird nur bei passendem Auftrag ausgeführt. Eine begleitete
lokale Demo benötigt keinen automatischen Cloud-Livegang. Die Nummern der
PassPilot-ROADMAP (1–8) und deren Skalierungsstufen A–E sind keine LP-002-Phasen.

### Konkrete Fortsetzung

1. **P2-2 abschließend visuell abnehmen.** Umsetzung, 13 neue Integrationsfälle
   und Live-Durchlauf sind dokumentiert. Bestehende Firma per Einladung oder
   bewusste leere Neuanlage mit gleichem Konto; keine Wiederherstellung alter Daten.
   Anschließend Reichweite des Versionsschutzes P2-3 festlegen.
2. Die nötigen isolierten Szenarien im Rahmen von Tag 28 festhalten; vorhandene
   Tests und Nachweise anrechnen, ohne einen Lerntag pauschal abzuhaken.
3. P2-3 und den Zeitpunkt/Umfang von P2-4 klären, anschließend den abgestimmten
   Designblock P2-6 durchführen.
4. Nach den Änderungen Regression/CI und die manuellen P2-5-Nachweise vervollständigen;
   dann Tag 30 und Gate „MVP testbereit“ separat abnehmen.
5. P3 bleibt ein eigener Auftrag. Erste Gespräche auf Basis des vorzeigbaren Kerns
   vorbereiten; vollständige Excel-/PDF-Importe oder KI sind dafür keine Voraussetzung.

### Quellen zum geprüften Brain-Stand

- [LP-002/PLAN: Phasen, Tagesliste und gesondertes Livegang-Paket](https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/KI_Lernen/LERNPL%C3%84NE/LP-002/PLAN.md)
- [Formaler Lernstand](https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/KI_Lernen/STAND.md)
- [Lernbeschlüsse E-010 bis E-014](https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/KI_Lernen/ENTSCHEIDUNGEN.md)
- [Brain-Regeln](https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/System/BRAIN_REGELN.md)


## Bisherige Übergabe vom 20.09.2026

**Fortsetzung am 20.09.2026:** Die nächste Phase ist mit Bestandsprüfung und
Entscheidungsvorlage gestartet. Lotsora lokal/GitHub auf `5bebdb6`; Brain-KI-GitHub
erneut bei `0439b2c` gelesen, lokale Brain-Kopie 11 Commits dahinter und unverändert.
Prüfumfang, Dokumentationswidersprüche und P2-1-Vergleich stehen in der
[verbindlichen Restpunkteliste](RESTPUNKTE-GATE-2026-09-20.md#neue-phase-bestandsprüfung-am-20092026).
Kevin hat für P2-1 volle Selbstbedienung, die neutrale Pass-Hinweisseite und die
Empfehlung zum bewussten Löschzeitpunkt nach Gelegenheit zur Datensicherung gewählt.
Die anschließende Freigabe bestätigt die endgültige Selbstbedienung mit ausdrücklicher
Ja/Nein-Auswahl für alle persönlichen Mitarbeiterkonten und separater Auswahl für
das eigene Konto. Alle verlieren in jedem Fall den Firmenzugriff.
P2-1 ist lokal umgesetzt und geprüft; aktueller Nachweis und Betriebsgrenzen in
[P2-1-UMSETZUNG-2026-09-20.md](P2-1-UMSETZUNG-2026-09-20.md).
Kevin hat P2-1 nach der Live-Vorführung mit „top passt so“ abgenommen und zum
Tagesabschluss die Sicherung auf `main` ausdrücklich beauftragt. Browserhelfer und
isolierte Testinstanz sind beendet; synthetische Konten/Firmendaten/Dateien bereinigt.
Der eigene Designblock unten ist vor dem ersten Kundentest eingeplant.

Ursprüngliche Übergabe vor dieser Fortsetzung: Kevin hat am 20.09.2026 das lokale Gate „MVP funktional vollständig“ ausdrücklich
freigegeben und den Push nach main beauftragt. Die nächste Phase beginnt erst in
einem neuen Chat. Hier wurden noch keine Arbeiten an P2/P3 begonnen.

## Maßgebliche Dokumente

**Dauerhafte Arbeitsvorgabe von Kevin:** Die Brain-KI immer mit berücksichtigen.
Vor Planung und Umsetzung die aktuellen zugänglichen Brain-Regeln und die für
Lotsora/PassPilot relevanten Entscheidungen, Learnings und Projektunterlagen lesen
und mit dem Lotsora-Stand abgleichen. Referenziertes Repository:
https://github.com/schaufkevin4-commits/Brain-KI (Projektbereich `PassPilot`).
Bei fehlendem Zugriff die Lücke ausdrücklich benennen; alte Verweise nicht als
Nachweis einer aktuellen Prüfung darstellen. Widersprüche transparent machen.
Seit dem Dauerauftrag vom 22.09.2026 umfasst die Arbeit auch die laufende Pflege
und Synchronisierung der ungeschützten Brain-Status-/Planungsdateien. Die bisherigen
Ausnahmen für geschützte Dateien bleiben erhalten; Details in Brain-CLAUDE.md.

- [Verbindliche Restpunkteliste](RESTPUNKTE-GATE-2026-09-20.md)
- [Browserabnahme, Profilergänzung und ausdrückliche Freigabe](GATE-BROWSERABNAHME-2026-09-20.md)
- [Architekturbeschluss einschließlich mehrerer Benutzer pro Firma](ARCHITEKTURBESCHLUSS-2026-09-20.md)

## Abgeschlossener Gate-Stand (historisch, vor P2-1)

Alle fünf P1-Korrekturen aus der Doppelprüfung umgesetzt (Basiscommit `ccf4c5f`):
Storage-Löschrechte, Site-URL-Prüfung vor Mutationen, direkte Action-Tests,
verständliche Fehler bei fehlenden/fremden Löschzielen und Bereinigung alter
Policies samt stabilen Widerrufszeitpunkten. Anschließend Team-/Produkt-/Datei-/Passablauf
im Browser geprüft, lokalen Anmeldehelfer korrigiert und das Firmenprofil klarer
gegliedert. Konto/Rolle, öffentliche und interne Angaben, Länderauswahl und
Website-Normalisierung sind umgesetzt. Nur der Firmenname ist Pflicht.

Die neue Migration ist ausschließlich in `lotsora-integration` angewendet (23
Migrationen). Kein Cloud-Rollout, kein DB-Reset, keine Kundenfreigabe.
Testdaten vollständig abgebaut. Zum nächsten Browsertest die isolierte Instanz
und den Browserhelfer erneut starten; frühere Loginlinks und Testprodukte sind temporär.

## Nächste Phase: für den ersten Kunden vorbereiten

P2-1 wurde entschieden und lokal einschließlich Dateibereinigung, Kontoauswahl,
Wiederaufnahme und dauerhaft reservierter öffentlicher IDs umgesetzt und geprüft.
Die lokale Vorschau ist zum Tagesabschluss beendet; für eine neue Prüfung den
isolierten Browserhelfer mit frischen synthetischen Daten starten.
Migrationen 24/25 sind ausschließlich in `lotsora-integration` angewendet.
Vor einem später beauftragten Cloud-Livegang muss P3 den dauerhaften Betrieb des
Löschworkers einschließlich Überwachung und Backup-/Restore-Abgleich einrichten.

Weitere P2-Punkte vor erstem Kunden:

1. Klarer Weg für Konten ohne Firmenmitgliedschaft (eigene Firma oder Supportweg).
2. Festlegen, ob Versionsschutz für sämtliche API-Schreibwege gelten soll.
3. Für P2-4 Zeitpunkt und Umfang getrennter Entwurfs-/Veröffentlichungsstände
   entscheiden: Die Richtung ist durch A4 bereits beschlossen; offen ist die
   Vorziehung vor den ersten Kunden. Heute werden gespeicherte Änderungen
   weiterhin sofort öffentlich sichtbar.
4. Physischer QR-Druckscan und echte Screenreader-Stichprobe nachholen.

### Eigener Designblock vor dem ersten Kundentest (P2-6)

Die funktionale Gate-Freigabe ist keine Abnahme der endgültigen visuellen Gestaltung.
Der neue Auftrag plant dafür ausdrücklich einen eigenen Block ein, nach Klärung
der relevanten Produktabläufe und vor dem ersten Kundentest:

1. **Richtung gemeinsam festlegen:** Bestehendes Frontend und bestätigte
   UX-Struktur als Ausgangspunkt prüfen; wenige konkrete visuelle Richtungen
   für interne Anwendung und öffentlichen Pass zeigen. Farben, Typografie,
   Dichte und gewünschte Wirkung mit Kevin abstimmen. Keine umfassende
   Überarbeitung vor seiner Entscheidung; finale Designrichtung ist noch offen.
2. **Gemeinsame Gestaltung umsetzen:** Einheitliche Farben, Schriftgrößen,
   Abstände, Formulare, Schaltflächen, Statusanzeigen und Fokusdarstellung auf
   Basis der vorhandenen Komponenten. Dashboard, Produktübersicht, Editor,
   Profil, Teamverwaltung und öffentlicher Produktpass gehören vollständig
   dazu; Auth-/Einladungsseiten und neue P2-Abläufe konsistent anschließen.
3. **Alle Zustände gestalten:** Verständliche Lade-, Fehler-, Leer- und
   Erfolgszustände; Handlungswege für Konten ohne Firma. Status und Fehler
   nicht allein über Farbe vermitteln, bestehende Rechte und Freigaben erhalten.
4. **Live zeigen und prüfen:** Umgesetzte Änderungen im sichtbaren Browser auf
   Handy-, Tablet- und Desktop-Breiten vorführen. Lesbarkeit, Kontrast,
   Tastaturbedienung, Fokus, Beschriftungen, Zoom und nutzbare Touch-Ziele prüfen.
5. **Separat abnehmen:** Visuelle Zustimmung von Kevin dokumentieren. Echte
   Screenreader-Prüfung anschließend mit benanntem Reader, Browser, Datum,
   Abläufen und Befunden durchführen; Entwicklerchecks ersetzen sie nicht.
   Physischen QR-Druckscan mit dokumentierter Etikettengröße/Druck und echtem
   Telefon separat nachweisen. Beide bleiben P2-5 bis zum tatsächlichen Nachweis.

Abschluss: abgestimmte, konsistente Gestaltung aller genannten Seiten und
Bildschirmgrößen, sichtbare Browsernachweise, nachvollziehbare Barrierefreiheits-
und QR-Prüfung sowie geschlossene oder ausdrücklich entschiedene Kundenrestpunkte.
Danach ist eine eigene Kundenfreigabe erforderlich. Cloud-Vorbereitung bleibt
das getrennte P3-Paket mit passendem ausdrücklichem Auftrag.

Erst anschließend das separate Cloud-Paket P3: Migrationskette auf garantiert
leerer Instanz, Hostingheader, bereinigte Tokenlogs, Auth-/Mail-/Domain-/HTTPS-Prüfung,
Backup/Wiederherstellung, Monitoring und Betriebsgrundlagen. Keine Anwendung auf
Cloud oder Reset ohne dazu passenden Auftrag. Die bisherigen Schiedsentscheidungen
und ausgenommenen Brain-Dateien bleiben verbindlich.

## Starttext für den neuen Chat

> Wir arbeiten an Lotsora weiter. Das lokale Gate wurde am 20.09.2026 freigegeben;
> der Abschlussstand liegt auf main. Lies zuerst README.md,
> docs/UEBERGABE-NACH-GATE-2026-09-20.md und docs/RESTPUNKTE-GATE-2026-09-20.md
> und prüfe den aktuellen Git-Stand. Berücksichtige immer auch die Brain-KI:
> Lies die aktuellen zugänglichen Brain-Regeln und relevanten PassPilot-Unterlagen,
> gleiche sie mit Lotsora ab und benenne fehlenden Zugriff oder Widersprüche.
> Halte die Brain-KI im selben Arbeitsabschluss aktuell und synchron; der Dauerauftrag
> vom 22.09. gilt. Bestehende Ausnahmen für geschützte Brain-Dateien bleiben erhalten.
> P2-2 ist lokal umgesetzt und geprüft; lies docs/P2-2-UMSETZUNG-2026-09-22.md.
> Unterscheide lokalen Code und veröffentlichten Lotsora-Stand; nicht vom alten
> main aus erneut implementieren. Abschließende visuelle Nutzerabnahme offen;
> danach P2-3-Reichweite klären. P2-1 ist bereits geprüft und abgenommen.
> Plane den eigenen abgestimmten Designblock vor dem ersten Kundentest weiter ein.
> Kein Cloud-Rollout, kein Deployment und kein Datenbank-Reset ohne passenden Auftrag.
