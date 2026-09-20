# Übergabe nach dem lokalen Gate

Kevin hat am 20.09.2026 das lokale Gate „MVP funktional vollständig“ ausdrücklich
freigegeben und den Push nach main beauftragt. Die nächste Phase beginnt erst in
einem neuen Chat. Hier wurden noch keine Arbeiten an P2/P3 begonnen.

## Maßgebliche Dokumente

- [Verbindliche Restpunkteliste](RESTPUNKTE-GATE-2026-09-20.md)
- [Browserabnahme, Profilergänzung und ausdrückliche Freigabe](GATE-BROWSERABNAHME-2026-09-20.md)
- [Architekturbeschluss einschließlich mehrerer Benutzer pro Firma](ARCHITEKTURBESCHLUSS-2026-09-20.md)

## Abgeschlossener Stand

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

Zuerst P2-1 konkret entscheiden: Wie kann der alleinige Firmenverantwortliche sein
Konto beziehungsweise seine Firma löschen lassen? Mit Kevin Selbstbedienung und
dokumentierten Betreiberprozess vergleichen; keine Variante eigenmächtig festlegen.
Danach den gewählten Ablauf einschließlich Dateibereinigung und dauerhaft reservierter
öffentlicher IDs umsetzen und prüfen.

Weitere P2-Punkte vor erstem Kunden:

1. Klarer Weg für Konten ohne Firmenmitgliedschaft (eigene Firma oder Supportweg).
2. Festlegen, ob Versionsschutz für sämtliche API-Schreibwege gelten soll.
3. Entscheiden, ob gespeicherte Änderungen weiter sofort öffentlich werden oder
   getrennte Entwurfs-/Veröffentlichungsstände nötig sind.
4. Physischer QR-Druckscan und echte Screenreader-Stichprobe nachholen.

Erst anschließend das separate Cloud-Paket P3: Migrationskette auf garantiert
leerer Instanz, Hostingheader, bereinigte Tokenlogs, Auth-/Mail-/Domain-/HTTPS-Prüfung,
Backup/Wiederherstellung, Monitoring und Betriebsgrundlagen. Keine Anwendung auf
Cloud oder Reset ohne dazu passenden Auftrag. Die bisherigen Schiedsentscheidungen
und ausgenommenen Brain-Dateien bleiben verbindlich.

## Starttext für den neuen Chat

> Wir arbeiten an Lotsora weiter. Das lokale Gate wurde am 20.09.2026 freigegeben;
> der Abschlussstand liegt auf main. Lies zuerst README.md,
> docs/UEBERGABE-NACH-GATE-2026-09-20.md und docs/RESTPUNKTE-GATE-2026-09-20.md
> und prüfe den aktuellen Git-Stand. Beginne mit der Entscheidungsvorlage für P2-1:
> Konto-/Firmenlöschung für einen alleinigen Firmenverantwortlichen. Stelle mir
> die notwendigen Fragen direkt hier im Chat. Erst nach meiner Entscheidung den
> ausgewählten Ablauf implementieren. Kein Cloud-Rollout und kein Datenbank-Reset.
