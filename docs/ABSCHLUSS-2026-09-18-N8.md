# N8 / QR / proxy – lokaler Abschluss, 18.09.2026

## Ergebnis
Der beauftragte technische Block ist umgesetzt und lokal geprüft; keine weitere Baustelle begonnen. Die vollständige manuelle Barrierefreiheitsabnahme und physische QR-Abnahme bleiben offen. Gesamt-Gate und Livegang sind nicht freigegeben.

## Änderungen und Belege
- `app/(intern)/produkte/[id]/MaterialAbschnitt.tsx`: instanzspezifische IDs, responsive Materialzeilen, Fokus auf neue/benachbarte Zeile oder Hinzufügen-Schalter, zugeordnete und angekündigte Summe. Bestehende N9-Speicherkoordination bleibt erhalten.
- `ProduktFormular.tsx`: Pflichtfeldhinweise über `aria-describedby`, Fokus beim Schrittwechsel bis zum Dokumentfeld sowie beim Anzeigen aller Abschnitte; umbrechende Aktionszeilen. Entwürfe bleiben trotz fehlender Pflichtangaben speicherbar.
- `app/(intern)/layout.tsx`, Editor-`page.tsx`, `DokumenteAbschnitt.tsx`: Sprunglink, benannte Navigation, eindeutiger Editortitel, mobile Kopf-/Dokumentzeilen.
- `app/globals.css`: Geist-Schriftvariable korrigiert; sichtbare Tastaturkontur; kontrastreichere Hilfstexte und Eingaberänder. Neutrale Token-Kontraste rechnerisch: Hilfstext auf Weiß ca. 5,51:1, auf muted ca. 5,05:1; Eingaberand auf Weiß ca. 3,23:1. Keine vollständige WCAG-Zertifizierung.
- `lib/qr.ts`, `QrCodeAbschnitt.tsx`, `QrAktionen.tsx`: vier weiße Randmodule, zugänglicher QR-Name, Statusmeldungen für Kopieren/Download und verständliche Fehler. Kanonische Pass-URL unverändert.
- Root-`middleware.ts` durch `proxy.ts` ersetzt; `updateSession` samt Zugriffsschutz unverändert. Installierte Next-16.3.5-Dokumentation gelesen. Deren benannter Proxy-Testhelfer wird tatsächlich noch als `unstable_doesMiddlewareMatch` exportiert; Tests verwenden diesen vorhandenen Export.

## Nachweise
- **113 Unit-Tests bestanden**, darunter 15 Proxy- und sieben QR-Tests. QR-Matrix/Rand bei M/Q/H; SVG-Raster und daraus erzeugtes PNG bei 256/1024 Pixeln unabhängig bis zur ursprünglichen Pass-URL dekodiert. Einzige neue Abhängigkeit: Entwicklungs-Testdecoder `jsqr@1.4.0`; keine bestehenden Pakete aktualisiert.
- **Acht echte Produktions-HTTP-Tests bestanden**: Gäste werden intern zum Login umgeleitet; A/B erreichen eigene Produkte, fremde zeigen „Produkt nicht gefunden“. N3-Pass-/Datei-/Fehlerregressionen weiterhin grün.
- Produktionsbuild, TypeScript, ESLint und `git diff --check` erfolgreich. Keine erneute vollständige DB-Integrationssuite: vorherige 85 N3-Integrationstests sind historische Nachweise, kein neuer N8-Testlauf.
- Sichtbarer lokaler Browser: 320/375 px ohne horizontalen Überlauf; keine doppelten IDs oder unbeschrifteten Eingabefelder im geöffneten Editor. Material-Fokus, geführte Weiter-Schritte bis Dokumente, Speichern und QR-Downloadaktionen geprüft. Dokumentfreigabedialog startet auf „Abbrechen“, Escape stellt den Auslöserfokus wieder her.
- Editor und Pass bei **200 % Textvergrößerung** mittels vorübergehender Test-CSS ebenfalls ohne Überlauf; Test-CSS entfernt. Native Browserzoom-Tastenkürzel wirkten in dieser Browserumgebung nicht.

## Verbleibende Abnahmegrenzen
- Accessibility-Baum mit Labels, Überschriften, Status und Dialog geprüft; keine echte Screenreader-Sprachausgabe. Diese sowie nativen Browserzoom auf dem Zielbrowser vor der abschließenden N8-Abnahme nachholen.
- Browser-PNG/SVG-Download wurde ausgelöst und bestätigt; unabhängige Dekodierung erfolgte am generierten SVG und dessen PNG-Raster, nicht an zurückgelesenen Browser-Downloaddateien.
- Etikettengröße festlegen, tatsächliche Exportdateien drucken und mit Handys scannen, spätestens vor Kundeneinsatz. Keine Aussage über reale Druck-/Kameraqualität.

## Arbeitsstand und nächster Einstieg
HEAD und lokales origin/main unverändert `4ca4b3ccf985e90ba3ee88c13d9a1b4106a7b7b0`, Branch `codex/n9-autosave-veroeffentlichung`. N3-Änderungen geschützt; N3/N8 weiterhin uncommitted. Kein Commit, Push, Deployment oder Projekt-Cloudzugriff. Keine neue Migration: 21 Migrationen weiterhin ausschließlich in lotsora-integration geprüft. `editor_version` ist nur Konflikttoken; getrennte Bearbeitungs-/Veröffentlichungsstände bleiben offen.

Synthetische Konten, Produkte, Storage-Objekte und Dateivorgänge nach Bereinigung jeweils **0**. Lokale Testserver und lotsora-integration gestoppt; normale Entwicklungsinstanz unverändert. Temporäre Browseransicht geschlossen, Viewport zurückgesetzt.

Nur nach neuem Auftrag: Git-/Dateistand auf zwischenzeitliche Änderungen prüfen; die oben genannten manuellen N8-Restnachweise nachholen. Danach folgen die begrenzten Architekturentscheidungen aus der Roadmap und der lokale Gesamtsystemcheck mit Gate-Vorlage. Heute hier gestoppt.

Reproduzierbare lokale Sichtprüfung: `node scripts/integration.mjs start`, dann `node scripts/integration.mjs browser`; Einstieg in `.local-tests/n8-browser-ready.json`. Stop über `.local-tests/n8-browser-stop`, anschließend `node scripts/integration.mjs stop`. Der Browser-Helfer erzeugt nur isolierte Testdaten, läuft höchstens 40 Minuten und bereinigt sie im Abschluss.
