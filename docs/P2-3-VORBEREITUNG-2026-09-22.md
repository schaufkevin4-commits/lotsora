# P2-3 – Reichweite des Versionsschutzes

Stand: 22.09.2026, geprüft auf lokaler Lotsora-Basis `69e4c7c`.
Status: Schreibwege inventarisiert, Entscheidung zum Umfang bei Kevin angefragt.
Keine Änderung an DB-Rechten, RPCs oder Migrationen aus dieser Vorbereitung.

## Konkretes Problem und Empfehlung

Zwei Nutzer laden denselben Produktstand. Nutzer A speichert zuerst.
Im bestehenden Editor wird der anschließende veraltete Save von Nutzer B mit
einem Konflikt abgewiesen. Ein API-Aufruf über eine ältere Speicherfunktion oder
direkte Tabellenänderung verlangt dagegen keine erwartete Editorversion.

Empfehlung: Dieser Schutz soll für alle nutzerseitigen Schreibwege gelten, die
das Produktformular oder seinen Veröffentlichungsstatus verändern. Ein veralteter
Stand darf neuere Daten nicht still überschreiben. Vorhandene Änderungen im
Editor bleiben erhalten und können nach bewusstem Neuladen erneut bearbeitet werden.

Alternative: Schutz vorerst auf die vorhandenen geprüften Editor-RPCs beschränken.
Dann bleibt die API-Lücke bewusst bestehen. Die Entscheidung ist noch offen;
„nächster Schritt“ wird nicht als Wahl zwischen diesen Varianten dokumentiert.

## Geprüfte Wege

| Weg | Heutiger Schutz | Folgerung für empfohlenen Umfang |
|---|---|---|
| `save_product_checked` | Produktsperre + erwartete `editor_version`; danach alte Speicherfunktionen | Als unterstützten Einstieg erhalten; Berechtigungskette beim Entziehen alter Rechte anpassen |
| `set_product_publication_checked` | Produktsperre + erwartete Version | Unterstützten Einstieg erhalten |
| `save_product`, `save_product_with_article` | Prüfen aktuellen Status, aber keine erwartete Bearbeitungsversion | Direkte Nutzung ohne Version schließen oder explizit versionierte Nachfolger |
| `publish_product`, `withdraw_product` | Produktsperre, aber kein Versionsvergleich | Direkte versionslose Nutzung schließen |
| `replace_product_materials` | Atomare Ersetzung unter Produktsperre, ohne erwartete Version | Direkte versionslose Nutzung schließen |
| `products` UPDATE | Trigger erhöht Version bei Formular-/Statusänderung; keine erwartete Version des Schreibers | Formular-/Statusfelder dürfen nicht weiter ungeprüft direkt geändert werden |
| Materialien, Textil- und Nachhaltigkeitsdaten INSERT/UPDATE/DELETE | Trigger erhöht Produktversion; spätere Editor-Saves erkennen diese Änderung | Auch diese direkten Schreibwege können selbst veraltete Daten ersetzen; in Grenze einbeziehen |
| Ältere Services `updateProdukt`, `saveMaterialien`, `saveTextildaten`, `saveNachhaltigkeit`, `veroeffentlicheProdukt`, `zieheProduktZurueck` | Nutzen direkte bzw. ältere Wege | Aufrufer umstellen oder ungenutzte Schreibfunktionen entfernen; Tests nicht bloß löschen |

Aktuelle App-Actions speichern über `saveProdukt` und
`setzeProduktVeroeffentlichung` mit erwarteter Version. Die alten
Veröffentlichungsservices werden noch in Integrationstests verwendet.
Tests und Fixtures verwenden direkte Produkt-/Untertabellenwrites; diese müssen
bei einer Rechteänderung gezielt angepasst werden, ohne Fachprüfungen auf
service_role zu verlagern.

Belege:
- `supabase/migrations/20260916120000_editor_konfliktschutz.sql`
- `supabase/migrations/20260914120000_veroeffentlichungsregeln.sql`
- `supabase/migrations/20260915210000_uploadvertrag_produktbild.sql`
- `lib/services/products.ts`
- `tests/integration/editor.test.ts`, `publication.test.ts`, `teams.test.ts`

## Umfang sauber abgrenzen

`editor_version` bezeichnet heute Produktformular und Status, keine vollständige
Veröffentlichungsrevision. Dokumente, Dateioperationen, Firmenprofil, Produktanlage,
Produktlöschung und Bildwechsel dürfen nicht pauschal durch entzogene Rechte
unbenutzbar werden. Das Bild besitzt bereits einen Vergleich gegen den erwarteten
alten Bildpfad über `set_product_image`; direkte Umgehungsmöglichkeiten sind beim
Ändern der Produktrechte mitzuerfassen. Für Dokument-/Löschkonflikte keine
weitergehende Versionsgarantie behaupten. P2-4 (getrennte Entwurfs- und
Veröffentlichungsstände) bleibt ein eigener Punkt.

## Umsetzung nach Umfangsentscheidung

1. Alle öffentlich aufrufbaren Schreibfunktionen und wirksamen Tabellen-/
   Spaltenrechte auf der isolierten Instanz gegen die Migrationen abgleichen.
2. Nur eine additive Migration. Die aktuelle `SECURITY INVOKER`-Kette darf nicht
   durch bloßes REVOKE beschädigt werden. Kontrollierte Eintrittspunkte benötigen
   die bisherigen internen Schreibrechte, ohne sie normalen API-Aufrufern erneut
   zu öffnen. RLS und aktuelle Firmenmitgliedschaft/Entzug bleiben wirksam;
   bei privilegierten Funktionen Akteur, Produktzugriff, feste Suchpfade und
   ausführbare interne Helfer ausdrücklich prüfen.
3. Version unter derselben Produktsperre vergleichen, gesamte Änderung atomar
   ausführen und endgültige Version zurückgeben. Keine automatische Wiederholung
   mit heimlich frisch geladener Version; das würde den Konflikt verschleiern.
4. Veraltete Services/Aufrufer und Testaufbau migrieren, DB-Typen regenerieren.
   Produktanlage, Bild-/Dokumentabläufe, Löschung und Materialvalidierung erhalten.
5. Gezielte neue Integrationstests, dann bestehende Regression und Live-Vergleich
   zweier Editorstände. Nur `lotsora-integration`, kein Reset/Cloud-Apply/Deploy.

## Erforderliche Nachweise

- Gleiche alte Version, zwei konkurrierende Writes: genau ein Erfolg; zweiter
  Konflikt, neuer Bestand unverändert.
- Alter Save nach Veröffentlichung/Rücknahme oder Untertabellenänderung abgewiesen.
- Alle alten RPCs und direkten Schreibumgehungen verweigert; neue reguläre Wege
  funktionieren weiterhin.
- Fehlende/falsche Version, fremder Nutzer und entfernter Mitarbeiter abgewiesen.
- Validierungsfehler rollt Felder, Untertabellen und Version gemeinsam zurück.
- Zustände nach Einladungs-/Rollenwechsel, Produkt-/Firmenlöschung sicher.
- Produktanlage, Bildvergleich, Dokumente, Dateibereinigung und öffentliche Pässe
  funktionieren nach Berechtigungsänderung weiter.
- Formular bleibt bei Konflikt erhalten; keine automatische Überschreibwiederholung.

Die 148 Unit-, 133 Integrations- und 11 HTTP-Tests vom vorherigen P2-2-Lauf bleiben
historische Nachweise dieses Tages, keine zusätzliche Prüfung durch diese
Vorbereitung. Für den nachfolgenden kleinen Passworthinweis wurden gezieltes
ESLint, TypeScript und der sichtbare Browserlink geprüft.

## Erledigter UI-Nachtrag zur Passwortfrage

Beide Löschformulare nennen jetzt „Passwort deines Benutzerkontos“, erklären
die Weitergeltung bei einer neuen Firma und verlinken `/passwort-vergessen`.
Labels sind über `aria-describedby` mit dem Hinweis verknüpft.
Im Browser wurde die Firmenlöschseite und das Ziel „Passwort zurücksetzen“
geprüft. Keine Löschung ausgelöst, keine E-Mail versendet, Passwortschutz erhalten.

Kevin sagte anschließend zur Erklärung „top dann nächster schritt“.
Der Arbeitsfokus geht damit zu P2-3; die Passwortfrage war eine Lücke der
bereitgestellten Testanmeldung, keine passwortlose Firmenregistrierung.
LP-002 Phase 6, formal 27/40 und Tag 28 offen bleiben unverändert.

