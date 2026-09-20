# Firmen gemeinsam nutzen – lokaler Abschluss 20.09.2026

Auftrag: Nach dem bestätigten Architekturentscheid mit dem nächsten sinnvollen Schritt beginnen und live im Browser zeigen. Mehrere Benutzer derselben Firma sind lokal implementiert und geprüft. Ausgangspunkt `f652e0c`, Arbeitszweig `codex/n9-autosave-veroeffentlichung`; dieser Stand ist noch nicht committed/gepusht. Das Gesamt-Gate bleibt offen.

## Umgesetzter Umfang

- Eine Firma je Benutzer, ein Firmenverantwortlicher und beliebig viele Mitarbeiter. Die Verantwortung wird aus `manufacturers.user_id` abgeleitet; keine zweite, widersprüchliche Rollenspalte. Bestehende Verantwortliche werden als Mitglieder übernommen, Firmen-/Produkt-/Pass-IDs bleiben erhalten.
- Beide Rollen bearbeiten Produkte, veröffentlichen und bearbeiten Dateien unter den bestehenden Regeln. Profiländerung, Einladen, Entfernen und Übergabe sind dem Verantwortlichen vorbehalten. `/team` zeigt Mitglieder, Rollen und offene Einladungen. Mitarbeiter sehen eine eingeschränkte Verwaltungsoberfläche.
- Einladungen sind an eine bestätigte E-Mail-Adresse gebunden, sieben Tage gültig und widerrufbar. Maximal 25 offene Einladungen je Firma. Ein neuer Link für dieselbe Adresse widerruft den alten. In der Datenbank steht ausschließlich der SHA-256-Hash; der vollständige Link wird einmal angezeigt und manuell geteilt. Kein automatischer Einladungsversand.
- `/einladung/[token]` ermöglicht Anmeldung, Registrierung eines Teamkontos und bewusste Annahme. Registrierung für eine Einladung erzeugt keine eigene Firma. Frei beschreibbare Metadaten können nur die Firmenanlage unterdrücken, niemals Firmenrechte vergeben. Ein vorhandenes Konto mit anderer Firma wird nicht verschoben oder zusammengeführt.
- Annahme, Widerruf, Entfernen und Verantwortungsübergabe sind Datenbankfunktionen mit eigenen Rechteprüfungen und Sperren. Wiederholte erfolgreiche Annahme ist idempotent; ein verbrauchter Link kann einen entfernten Benutzer nicht wieder aufnehmen. Gleichzeitiger Beitritt zu zwei Firmen lässt genau einen gewinnen.
- Der Verantwortliche kann sich nicht selbst entfernen. Kontolöschung des Verantwortlichen wird durch einen Fremdschlüssel verhindert. Übergabe verlangt ein bestehendes Firmenmitglied und widerruft offene Einladungen. Löschen eines Mitarbeiterkontos entfernt keine gemeinsamen Produkte.
- Produkte, Details, Dokumente, Storage und Upload-/Bereinigungsfunktionen prüfen die aktuelle Firmenmitgliedschaft. `file_operations.manufacturer_id` erhält den Firmenbezug auch nach Produktlöschung; `owner_id` bleibt der ursprüngliche Akteur. Ein verbleibendes Mitglied kann geprüfte Dateiabläufe fortsetzen, auch wenn der Uploader entfernt wurde.

## Nachweise

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests | 113 bestanden |
| Gesamte DB-Integrationssuite | 92 bestanden, neun bewusst übersprungen (HTTP-/Browserläufe separat) |
| Abschließend erweiterte Teamdatei | Acht Tests bestanden; enthält zusätzlich den echten gleichzeitigen Save zweier Benutzer, Veröffentlichung und verweigerte Save-/Publish-Aufrufe nach Entzug. Insgesamt damit 93 DB-Testfälle, davon 85 bestehende und acht Teamfälle |
| Lint und TypeScript | Bestanden; abschließende Prüfung einschließlich ergänztem Teamtest |
| Produktionsbuild und Produktions-HTTP | Build und acht HTTP-Tests bestanden |
| Live-Browser | Einladung als Verantwortlicher erstellt; zweites Konto zunächst ohne Firmenzugang; Annahme über Oberfläche; beide Mitglieder sichtbar; Mitarbeiter sieht gemeinsamen Produktbestand und keine Teamverwaltung; Mitarbeiteränderung gespeichert und danach beim Verantwortlichen sichtbar |

`tests/integration/teams.test.ts` prüft außerdem fremde Firmen/Dateien, Metadatenmanipulation, direkte unerlaubte Mitgliedschafts- und Besitzeränderungen, Schutz des Tokenhashes, falsche/unbestätigte E-Mail, Ablauf/Widerruf, konkurrierenden Beitritt, Wiederholung, vorhandene Firmenzugehörigkeit, Zugriffsentzug mit unverändertem Sitzungstoken, Dateiübernahme/Bereinigung nach Uploaderentfernung sowie Übergabe und Kontolöschung.

Der erste Testlauf scheiterte am Testdatenabbau: Die bisherige Bereinigung verließ sich auf die nun absichtlich entfernte Kontolöschkaskade. Der Testhelfer löscht seither zuerst seine exakt erfassten Firmen über den isolierten SQL-Testzugang und anschließend Konten. Dafür wurden keine zusätzlichen Firmenlöschrechte an `service_role` vergeben. Die 14 zurückgebliebenen synthetischen Firmen dieses ersten Laufs wurden anhand konkreter IDs und Erstellzeiten identifiziert und bereinigt; spätere Tests einschließlich Bereinigung bestanden.

## Umgebung und Grenzen

Neue Migration: `20260920120000_firmenteams.sql`; insgesamt 22 Migrationen ausschließlich in `lotsora-integration`, API 55321. Die generierten Typen stammen aus dieser Instanz. Normale Entwicklungsdatenbank und Cloud unverändert. Kein Reset, keine echte Einladung und kein externer Versand.

Entzug verhindert neue berechtigungspflichtige Zugriffe und Schreibvorgänge. Bereits geladene Daten, begonnene Transaktionen und ausgestellte signierte Dateilinks werden nicht rückwirkend vernichtet; deren bekannte Restgültigkeit bleibt bestehen. Ein offener Browser wird nicht automatisch geleert. Für eine neue Anfrage wird die Mitgliedschaft erneut geprüft.

Autosave und Veröffentlichung behalten ihre bisherige Semantik. Separate Bearbeitungs-/Freigaberevisionen bleiben der beschlossene spätere Block vor kontrollierten Importen. Kein Mehrfirmenwechsel, Mehr-Brand-Modell oder frei konfigurierbares Rollensystem.

Vor Übernahme in eine weitere Umgebung: aktuelle Migrationen vollständig prüfen, vorhandene Dateivorgänge auf zuordenbaren Firmenbestand prüfen (aktive unzuordenbare Vorgänge blockieren die Migration bewusst), Auth-Bestätigungsadresse/Redirect-Konfiguration auf die echte Site abstimmen und Backup/Rollout separat durchführen. Der echte E-Mail-Bestätigungsablauf ist durch diese synthetische Browserdemo nicht abgenommen; die Datenbank verweigert nachweislich unbestätigte Adressen.

## Weiterarbeit

Nächster sinnvoller Block ist der vorbereitete zusammenhängende Gesamtsystemcheck auf dem Teammodell, einschließlich der N1-ID-Nachweislücke und echtem lokalen Auth-Bestätigungs-/Resetablauf. Weiter offen: Screenreader-Stichprobe (von Kevin vertagt), separater öffentlicher 200-%-Zoomnachweis, physischer QR-Druck-/Handyscan und die ausdrückliche Gate-Freigabe.

Die gewünschte Live-Demo läuft befristet mit synthetischen Daten auf Port 3109; der bestehende Browserhelfer räumt seine Testdaten bei regulärem Ende auf. Wiederholbar mit `node scripts/integration.mjs browser --team`; lokale Einstiegspfade stehen nur in `.local-tests/n8-browser-ready.json`. Reguläres vorzeitiges Ende über `.local-tests/n8-browser-stop`. Die isolierten Supabase-Container anschließend mit `node scripts/integration.mjs stop` stoppen, sofern sie nicht für weitere Arbeit gebraucht werden.
