# N8-Restabnahme – 19.09.2026

Nachtrag Tagesabschluss: Kevin hat anschließend die Übernahme und den Push nach main beauftragt. Angaben „kein Commit/Push“ unten beschreiben den vorherigen Blockabschluss. [Aktuelle Übergabe](TAGESABSCHLUSS-2026-09-19.md). Die offenen Abnahmegrenzen bleiben bestehen.

Ausgangsstand: `7d0d481`, Arbeitsbaum vor der Prüfung sauber. N8 ist weiterhin **nicht vollständig abgenommen**. Die bisherigen Nachweise stehen im [N8-Abschluss](ABSCHLUSS-2026-09-18-N8.md).

## Neue Vorbereitung

`scripts/verify-qr-downloads.mjs` prüft die zwei tatsächlich gespeicherten Browserexports. Es liest die Dateien unverändert ein, prüft Dateiformat und die erwartete PNG-Größe von 1024 × 1024 Pixeln, rastert das heruntergeladene SVG und dekodiert beide Dateien unabhängig mit `jsqr`. Beide müssen exakt dieselbe vorgegebene Pass-URL enthalten. Der JSON-Nachweis enthält Dateipfade, Größe, SHA-256 und dekodierte URL. Fehler führen zu Exitcode 1.

```powershell
node scripts/verify-qr-downloads.mjs 'https://lotsora.de/p/PASS-ID' 'C:\Pfad\produktpass-PASS-ID.svg' 'C:\Pfad\produktpass-PASS-ID.png'
```

Dabei die tatsächliche Pass-ID und die vom Browser gespeicherten Dateien einsetzen. Keine neu erzeugten Ersatzdateien als Browsernachweis verwenden.

Das Prüfwerkzeug wurde mit sechs synthetischen Kontrollfällen validiert: gültiges Paar, falsche Ziel-URL, weißes Bild ohne QR, falsche PNG-Größe, ungültige Datei und fehlende Datei. Alle erwarteten Ergebnisse bestanden. ESLint für das neue Skript und die Diff-Prüfung bestanden. Diese Kontrollen prüfen das Werkzeug, nicht den Browserdownload oder die Druckqualität.

## Browserbefund

Die isolierte Testanwendung wurde im integrierten Browser geöffnet. Der PNG-Menüpunkt löste die Meldung „PNG-Download gestartet.“ aus. Das Downloadereignis blieb jedoch aus (Timeout); im üblichen Downloads-Verzeichnis war keine entsprechende Datei vorhanden. Daher kein erfolgreicher Downloadnachweis und noch keine eindeutige Zuordnung zu Produktcode oder Browserumgebung.

Die native Chrome-Steuerung war im vorausgehenden Versuch wegen nicht zuverlässig erkennbarer Browser-URL blockiert. Kevin hat den lokalen synthetischen Testzugang selbst geöffnet und die Downloads ausgelöst. Die danach tatsächlich im Downloads-Ordner gespeicherten Dateien wurden mit dem neuen Skript geprüft. Das ist kein Zugriff auf Produktionsdaten.

## Echte Downloadnachweise – bestanden

Prüfzeit: 19.09.2026, 18:19:39 UTC. Erwarteter Inhalt beider Dateien: `https://lotsora.de/p/yxhRbC1A5Yb1`. Diese ID gehört zu einem temporären synthetischen Testpass; die URL auf der echten Domain wurde nicht als erreichbarer Produktionspass geprüft.

| Datei aus dem Downloads-Ordner | Größe | Abmessungen | SHA-256 |
|---|---:|---|---|
| produktpass-yxhRbC1A5Yb1.svg | 1565 Bytes | 256 × 256, zur Dekodierung auf 1024 × 1024 gerastert | `56b200e861c700f50b736b0eecac1e0a7689b35817ea6cd12c46f0b1611fc547` |
| produktpass-yxhRbC1A5Yb1.png | 28801 Bytes | 1024 × 1024 | `34d154cc0860523de85621922405c1551e770bfb07678f9ed5fa32f14c4e56af` |

Beide gespeicherten Originaldateien wurden unabhängig erfolgreich zur erwarteten Pass-URL dekodiert. Damit ist die zuvor offene Dateiprüfung für diesen manuellen Browserdurchlauf erfüllt. Der integrierte Browser lieferte diesen Nachweis nicht; dessen Downloadereignis-Timeout wurde nicht als Produktfehler gewertet.

## Noch auszuführen

Kevin bestätigte auf die konkrete Bitte, Editor und Pass bei nativem 200-%-Browserzoom auf Bedienbarkeit und abgeschnittene Inhalte zu prüfen: „Ja funktiniert auch“. Als manueller Nutzer-Nachweis protokolliert; keine eigene visuelle Agentenprüfung oder Screenshotbelege dieses Zoomdurchlaufs. Im Serverprotokoll sind Editor und interne Passvorschau belegt, kein separater Aufruf der öffentlichen `/p/`-Route. Die genaue Ansichtsabdeckung des Zoomdurchlaufs ist deshalb begrenzt; eine eigene 200-%-Zoomprüfung der öffentlichen Route bleibt zu ergänzen. Temporären Zoom nach Abschluss zurücksetzen.

1. Mit echter Screenreader-Sprachausgabe Überschriften, Feldbezeichnungen, Pflichtangaben, Speicher-/Downloadstatus und Dokumentfreigabedialog prüfen; Tastaturfokus muss nachvollziehbar bleiben. Kevin hat diese Prüfung für heute ausdrücklich offen gelassen.
2. Die öffentliche `/p/`-Route separat bei nativem 200-%-Zoom prüfen (siehe Nachweisgrenze oben).
3. Etikettengröße festlegen, tatsächliche Exportdateien drucken und mit Handys scannen, spätestens vor Kundeneinsatz.

Die Punkte 1–3 bleiben offen, bis entsprechende Nachweise vorliegen. Kein Architekturumbau, keine Migration, kein Commit, Push oder Deployment. Gesamt-Gate und Livegang bleiben offen.

## Abschluss

Browser-Testhelfer regulär beendet; Fixture-Bereinigung ohne gemeldeten Fehler (1/1 Helfertest bestanden). Isolierte Testinstanz anschließend gestoppt; temporäre integrierte Browseransicht geschlossen. Nur die automatisch erzeugte tsconfig-Änderung zurückgenommen. Dauerhafte lokale Änderungen: neues Prüfskript, dieser Bericht und Nachtrag in den Gate-Restpunkten. Keine App-Funktion geändert.
