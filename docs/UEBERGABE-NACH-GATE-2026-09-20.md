# Übergabe nach dem lokalen Gate

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
Berücksichtigung bedeutet keine automatische Synchronisierung und hebt die
bisherigen Ausnahmen für Änderungen an Brain-Dateien nicht auf.

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
> Bestehende Ausnahmen für Änderungen an Brain-Dateien bleiben erhalten.
> P2-1 (Konto-/Firmenlöschung) ist umgesetzt, geprüft und von mir abgenommen;
> lies dazu docs/P2-1-UMSETZUNG-2026-09-20.md. Beginne mit P2-2: vollständiger Weg
> für Benutzer ohne Firmenzugehörigkeit. Einladungsannahme und persönliche Löschung
> sind bereits vorhanden. Stelle die nötigen Produktfragen direkt hier im Chat.
> Plane den eigenen abgestimmten Designblock vor dem ersten Kundentest weiter ein.
> Kein Cloud-Rollout, kein Deployment und kein Datenbank-Reset ohne passenden Auftrag.
