# Manuelle Restabnahme – 20.09.2026

## Ergebnis nach Kevins Rückmeldung

Abschluss: Browserhelfer regulär beendet, Fixture-Bereinigung ohne gemeldeten Fehler (`1 passed`, Exitcode 0); isolierte Testinstanz anschließend gestoppt, Volumes erhalten. Keine Änderung am App-Code, kein Commit/Push/Deployment in dieser Restabnahme.

Kevin bestätigte zur gebündelten Prüfliste: „Ja funktinoert alles . einen drucker habe ich gerade nicht . mit dem handy kann ich den code scannen auch auf 200%“.

- Öffentlicher nativer 200-%-Zoom und die angeforderte Sprachausgabe-Stichprobe an Editorfeldern/QR-Menü werden als manueller Nutzer-Nachweis protokolliert. Keine eigene Audio-/Zoombeobachtung des Agenten, keine umfassende Barrierefreiheitszertifizierung und kein gesondert bestätigter Screenreader-Test des Freigabedialogs.
- Handyscan vom Bildschirm auch bei 200 % laut Kevin erfolgreich. Dies ersetzt keinen Ausdrucktest und belegt keine Produktiv-Erreichbarkeit der synthetischen Pass-ID.
- Beide tatsächlich gespeicherten Chrome-Exports wurden am 20.09.2026 um 14:18:00 UTC unabhängig dekodiert: exakt `https://lotsora.de/p/kHFoG72oaMYe`, Prüfer Exitcode 0.

| Originaldatei in Downloads | Bytes | Abmessungen | SHA-256 |
|---|---:|---|---|
| `produktpass-kHFoG72oaMYe.svg` | 1605 | 256 × 256; zum Dekodieren gerastert | `2ffd8040c02a630fcbd80bc86140a847bfe59e2d98d406a63cfcaa2edb00f611` |
| `produktpass-kHFoG72oaMYe.png` | 31947 | 1024 × 1024 | `4ee0d6eaf55fd0787e30719adde346d28d6df74b2214f2e5cbc8a4994ad2a390` |

**Offen bleibt der physische Ausdruck-/Handyscan in festgelegter Etikettengröße, spätestens vor Kundeneinsatz.** Kevin hat aktuell keinen Drucker. Die lokale Gate-Entscheidung ist weiterhin ausdrücklich zu treffen; die allgemeine Testbestätigung wird nicht als Livegang- oder Push-Freigabe ausgelegt. Die früheren Statusangaben unten dokumentieren die Vorbereitung und sind durch diesen Ergebnisabschnitt ersetzt.

**Neustart nach Pause:** Auf Kevins Auftrag wurde die abgelaufene Browser-Testsession erneut gestartet. Neuer Testfall: Produkt `5afedfe3-5195-4b74-9a6f-cb0a87e7b1f8`, öffentlicher lokaler Pass `http://127.0.0.1:3109/p/kHFoG72oaMYe`, erwarteter QR-Inhalt `https://lotsora.de/p/kHFoG72oaMYe`. Editor und öffentlicher Pass sind sichtbar erreichbar; Herkunft, Pflege-/Wasch- und Reparaturhinweise erneut ergänzt. Die IDs im ursprünglichen Abschnitt unten sind historisch. Alle manuellen Nachweise bleiben bis zur Rückmeldung offen.

Kevin hat nach dem [Gesamtsystemcheck](SYSTEMCHECK-2026-09-20.md) die gebündelte Restabnahme beauftragt. Die isolierte Testinstanz wurde ohne Reset neu gestartet; Browserhelfer auf 3109, temporärer lokaler Login auf 3110. Der Helfer begrenzt die Sitzung auf 40 Minuten und bereinigt danach seine synthetischen Daten.

## Aktueller Testfall

- Produkt: `1d40505e-d2b2-40a2-81a6-0ca981a804c3`
- Öffentliche lokale Ansicht: `http://127.0.0.1:3109/p/MeJzdUiMgnQ8`
- Erwarteter QR-Inhalt: `https://lotsora.de/p/MeJzdUiMgnQ8`
- Browseransicht geprüft: Name, Hersteller, Material, Herkunft, Farbe/Größe, Pflege-/Waschhinweise, Reparaturhinweise und öffentliches Dokument vorhanden; interne Artikelnummer und internes Dokument nicht angezeigt.

Die echte Domain ist für diese synthetische ID kein geprüfter Produktivpass. Ein physischer Scan soll zunächst die exakte QR-Zieladresse erkennen; er belegt keine Erreichbarkeit dieses Testpasses auf der echten Domain.

## Ausstehende Nachweise

| Prüfung | Status |
|---|---|
| Echte neue PNG-/SVG-Downloads in Chrome | vorbereitet, Dateien noch nicht erhalten |
| Unabhängige Dekodierung beider Dateien | wartet auf tatsächliche Browserexports |
| Öffentlicher Pass bei nativem 200-%-Zoom | wartet auf Nutzerbeobachtung in Chrome |
| Echte Windows-Sprachausgabe, Editor/QR-Menü/Freigabedialog | wartet auf Nutzerbeobachtung |
| Etikettengröße, Ausdruck und Handyscan | Verfügbarkeit und Ergebnis offen |

Die integrierte Browsersteuerung stellt derzeit ausschließlich den Codex-Browser bereit. Dessen zuvor reproduzierte fehlende Downloaddateien werden nicht erneut als erfolgreiche Exporte ausgegeben. Die manuelle Chrome-Bedienung und tatsächliche Sprachausgabe werden durch Kevin geprüft; der Agent dekodiert danach die gespeicherten Dateien mit `scripts/verify-qr-downloads.mjs`.

Noch keine neue manuelle Prüfung als bestanden markiert und keine Gate-Freigabe. Ergebnisse werden nach Rückmeldung ergänzt.
