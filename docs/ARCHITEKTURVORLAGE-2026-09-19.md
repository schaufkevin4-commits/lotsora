# Lotsora – fünf begrenzte Architekturentscheidungen

**Beschluss 20.09.:** Kevin hat die im Chat erläuterten Richtungen angenommen, mit einer Änderung: Mehrere Benutzer pro Firma sind bereits V1-Anforderung. Der bisherige Aufschub in A3 ist überholt. Maßgeblich ist der [Architekturbeschluss mit Team-Baublock](ARCHITEKTURBESCHLUSS-2026-09-20.md); die Vorlage unten bleibt als ursprünglicher Entwurf erhalten.

Nachtrag Tagesabschluss: Kevin hat anschließend die Übernahme und den Push dieser Vorlage nach main beauftragt. Das ist keine fachliche Annahme der Empfehlungen. Angaben „kein Commit/Push“ unten beschreiben den vorherigen Blockabschluss. [Aktuelle Übergabe](TAGESABSCHLUSS-2026-09-19.md).

Stand: 19.09.2026, Codebasis `7d0d481a52ff3105d531f0062a4392015a9f4327`. **Entscheidungsvorlage, noch kein fachlicher Beschluss oder Umsetzungsauftrag.** Die Bezeichnungen A1–A5 sind lokale Entwurfsnummern, keine neuen PP-Nummern. Grundlage: PRODUKTVISION, ROADMAP und Analyse vom 10.09., gezielt mit dem aktuellen Code abgeglichen.

## Empfehlung zur Entscheidung

Den bestehenden relationalen Textilkern weiterverwenden. Stabile Feld- und Vorlagenkennungen vorbereiten; Quellen später als getrennte, private Nachweise ergänzen. Herstelleridentität und dauerhafte Pass-ID erhalten. Vor kontrollierten Importen öffentliche Freigaben vom laufenden Bearbeitungsstand trennen.

| Entwurf | Empfohlene Richtung | Spätester sinnvoller Umsetzungspunkt |
|---|---|---|
| A1 Felder und Vorlagen | Ein kleiner versionierter Textilkatalog; Zuordnung pro Produkt | Vor dem ersten dauerhaften Importmapping oder einer zweiten Vorlagenversion |
| A2 Quellen | Private Quellversion → Vorschlag → menschliche Übernahme; Quellenbezug am konkreten Wertstand | Mit dem ersten echten Import, bevor Vorschläge in Produktdaten übernommen werden |
| A3 Hersteller | `manufacturer_id` bleibt die Eigentumsgrenze; Mitgliedschaften erst bei Bedarf | Vor dem zweiten Nutzer einer Firma oder der zweiten Firma eines Nutzers |
| A4 Veröffentlichung | Unveränderliche öffentliche Revision mit kontrolliertem Dateibezug | Vor der ersten Funktion, die „öffentlich unverändert bis Freigabe“ verspricht; insbesondere vor kontrollierten Importübernahmen |
| A5 Produktidentität | V1-Pass beschreibt ein konkretes Produktmodell mit einheitlichen veröffentlichten Angaben | Fachlich vor dem ersten dauerhaften Kundendruck; technisch vor Varianten-/Chargenfunktionen |

Der begrenzte Entwurfsblock ist damit ausgearbeitet. Die Entscheidungen bleiben Kevin vorbehalten. Die Roadmap verlangt dafür keine vollständige Template-, Import-, KI- oder Mehrbenutzer-Implementierung vor dem lokalen Gate. N8-Restnachweise und Gesamtsystemcheck bleiben eigenständige Aufgaben.

## A1 – Stabile Kennungen ohne neues Gesamtschema

**Ist:** Produkt-, Textil- und Nachhaltigkeitsfelder liegen in relationalen Tabellen. `saveProdukt` und `getOeffentlicherPass` in `lib/services/products.ts` bilden diese explizit ab. Kategorie ist ein Fachwert; ein versionierter Vorlagenbezug fehlt.

**Vorschlag:** Erste Vorlage `textile.basic`, Version `1`, Branche `textile`; als vorgeschlagene Kennungen zu verstehen. Ein veröffentlichter Katalogstand wird nicht überschrieben. Ein späterer additiver Produktbezug enthält Vorlagenkennung und Version; Kategorie bleibt separat. Ein kleiner Adapter verbindet stabile Feldschlüssel mit vorhandenen Spalten und Komponenten.

| Beispielschlüssel | Bestehender Bezug | Regel |
|---|---|---|
| `product.name` | `products.name` | Text; bestehende Veröffentlichungs-Pflichtregel |
| `product.article_number` | `products.article_number` | Optional, intern; kein Import-Primärschlüssel |
| `textile.materials` | `product_materials` | Versionierter Listenwert; Prozentangaben nach bisherigen Regeln |
| `textile.care_instructions` | `product_textile_data.care_instructions` | Optional; bestehende öffentliche Projektion |

Ein Katalogeintrag beschreibt Schlüssel, Typ, Einheit, Label, Reihenfolge, Validierung und erlaubte öffentliche Sichtbarkeit. Umbenannte Labels ändern den Schlüssel nicht. Bedeutungsänderungen erhalten eine neue Kennung oder eine explizite Versionsmigration. Ein Katalog ersetzt weder DB-Constraints noch RLS/Spaltenrechte. Unbekannte Versionen werden kontrolliert abgewiesen; kein stiller Wechsel zur neuesten Vorlage.

**Abwägung:** Alles direkt in den Komponenten zu belassen ist kurzfristig einfacher, macht dauerhafte Importmappings aber abhängig von UI-Namen. Ein dynamischer Vorlageneditor oder ein vollständiger EAV-/JSON-Umbau wäre für V1 unnötig groß.

**Spätere Abnahme:** Bestehende Textilprodukte werden nachvollziehbar zugeordnet und identisch dargestellt; interne Felder bleiben privat; alter Katalogstand bleibt lesbar; unbekannte Version wird verständlich abgefangen. Kein Schemaumbau in diesem Auftrag.

## A2 – Herkunft eines Wertes nachvollziehbar halten

**Ist:** Dokumente haben unter anderem ID, Pfad und Uploadzeit, aber keine eigenständige fachliche Quellversion mit Feld-Fundstelle (`lib/types/database.types.ts`, Tabelle `documents`). `replace_product_materials` löscht Materialzeilen und legt sie neu an; deren IDs eignen sich nicht für dauerhafte Quellenbezüge.

**Vorschlag:** Mit dem ersten Import einen ergänzenden Vertrag einführen:

- Quellversion: Hersteller, unveränderliche ID, privater Originaldateibezug, Inhalts-Hash, Format und Erfassungszeit. Ein Hash belegt gleiche Bytes, keine Echtheit oder fachliche Richtigkeit.
- Vorschlag: Hersteller/Produkt, Vorlagenversion, stabiler Feldschlüssel, typisierter Wert samt Einheit, Quellversion, konkrete Fundstelle, Parser-/Modellversion und Extraktionszeit.
- Übernahmeentscheidung: Akteur, Zeitpunkt, angenommen/abgelehnt/geändert, tatsächlich übernommener Wert und betroffener Wertstand. Spätere Wertänderung übernimmt eine alte Bestätigung nicht automatisch.

Für Materialangaben zunächst die gesamte Zusammensetzung als versionierten Listenwert behandeln. Stabile Einzelpositionen erst einführen, wenn ein realer Anwendungsfall Belege pro Materialzeile benötigt. Manuelle Eingaben erhalten Herkunft „manuell“ ohne erfundene Dokumentquelle. Widersprechende Quellen bleiben getrennt sichtbar. Quellen werden durch die Veröffentlichung eines abgeleiteten Wertes nicht öffentlich.

**Abwägung:** Ein bloßer Dokument-Link wäre kleiner, verliert aber beim Austausch den historischen Bezug. Detaillierte Belege an heutigen Material-IDs wären instabil. Mit dem ersten Import Wiederholungen explizit erkennen; leere Zellen bedeuten keine automatische Löschung, uneindeutige Produktzuordnung keine automatische Zusammenführung.

**Spätere Abnahme:** Quellaustausch lässt alte Nachweise unverändert; fremde Hersteller können Quellen nicht lesen; Ablehnung ändert keine Produktwerte; Wertänderung macht eine alte Bestätigung nicht zum Nachweis des neuen Wertes; Wiederimport erzeugt keine unbemerkten Doppelübernahmen. Aufbewahrungsdauer und Löschverfahren vor Speicherung realer Quellen entscheiden.

## A3 – Firma und Login auseinanderhalten

**Ist:** `manufacturers.id` und `user_id` sind bereits getrennt. `user_id` ist eindeutig und hat `ON DELETE CASCADE`; Produkte hängen wiederum am Hersteller. `getMeinHersteller` verwendet `maybeSingle`. Eigentumsprüfung/RLS und Dateivorgänge beruhen auf dem heutigen einzelnen Nutzer.

**Vorschlag:** Die stabile Hersteller-ID erhalten. V1 bleibt bei einem verantwortlichen Login je Hersteller. Sobald ein konkreter Pilot mehrere Zugänge benötigt, Mitgliedschaften mit Nutzer, Hersteller und Rolle ergänzen und den aktiven Hersteller explizit bestimmen. Marken bleiben bis zu bestätigtem Bedarf Freitext; spätere Marken gehören genau zu einem Hersteller.

**Abwägung:** Eine sofortige Mehrfirmenoberfläche vergrößert den Umfang ohne bestätigten Nutzen. Nur eine Mitgliedschaftstabelle anzulegen wäre ebenfalls unvollständig: `owns_product`, alle RLS-/Storage-Regeln, Registrierung, `maybeSingle` und `file_operations.owner_id` müssen gemeinsam angepasst werden. Die heutige Kaskade darf dann beim Löschen eines Mitglieds keine Firma samt Produkten entfernen.

**Spätere Abnahme:** Altkonten behalten dieselben Firmen-/Produkt-/Pass-IDs. A/B/anon und zwei Mitglieder einer Firma werden geprüft, ebenso Rollenentzug, letzter Verantwortlicher, Kontoentfernung und Dateibereinigung. Keine tenantübergreifenden Beziehungen oder allein clientseitigen Rechteprüfungen.

## A4 – Öffentlichen Stand bewusst freigeben

**Ist:** `getOeffentlicherPass` lädt aktuelle Produkt-, Hersteller-, Detail- und Dokumentwerte. Autosave kann diese öffentliche Darstellung ändern. `editor_version` ist ein Konflikttoken für Formular und Status. Die Migration `20260916120000_editor_konfliktschutz.sql` bindet Formularfelder, Material-/Textil-/Nachhaltigkeitsänderungen ein; sie deckt Herstellerdaten, Dokumentfreigaben und Bildwechsel nicht vollständig als gemeinsamen Passstand ab.

**Vorschlag:** Bestehende Tabellen bleiben Bearbeitungsstand. Eine neue unveränderliche Revision enthält nur öffentliche Werte, Vorlagenversion, unveränderliche Bild-/Dokumentversionen, Freigabeakteur und Zeitpunkt. Der Pass behält seine `public_id` und verweist auf die aktive öffentliche Revision. Änderungen am Bearbeitungsstand werden erst mit einer neuen Freigabe öffentlich; ebenso Änderungen an mitveröffentlichten Herstellerangaben. Vorschau und veröffentlichter Stand werden eindeutig beschriftet.

Freigabe prüft den konkret angezeigten Gesamtstand und erstellt/aktiviert die Revision atomar. Dafür bei Umsetzung einen gemeinsamen Konfliktvertrag für alle beteiligten Daten festlegen: Produktbestandteile und Dokument-/Bildänderungen müssen denselben Sperr-/Versionsregeln folgen; Herstelleränderungen benötigen einen mitgeprüften Herstellerstand. Das vorhandene `editor_version` allein reicht nicht. Ein Fehler darf weder eine halbe Revision noch einen teilweise geänderten öffentlichen Zeiger hinterlassen.

**Dateien sind Teil dieses Blocks:** Heute markiert ein Bildwechsel den alten Pfad zur Bereinigung (`20260915210000_uploadvertrag_produktbild.sql`). Künftig dürfen Dateien, die eine aktive Revision benötigt, nicht durch normalen Entwurfswechsel gelöscht werden. Unveränderliche Dateiversionen und referenzabhängige Bereinigung sind daher Voraussetzung; signierte URLs werden nicht im Snapshot gespeichert. Öffentliche Dateirouten müssen Revision und aktuelle Freigabe prüfen, statt nur den aktuellen Bearbeitungspfad zu verwenden.

**Rücknahme:** Produktzugriff und gesperrte Dateien bei neuen Abrufen schließen, internen Revisionsnachweis nach beschlossener Aufbewahrung behandeln. Dokumententzug bleibt eine sofortige Sperraktion für neue Zugriffe auch auf alte Revisionen; die gespeicherte Revision wird dafür nicht umgeschrieben. Bereits ausgegebene signierte Links, laufende Lesungen und heruntergeladene Dateien sind nicht rückwirkend widerrufbar. Die N3-Grenzen, einschließlich 300 Sekunden für neu durch die App ausgestellte Dateilinks, bleiben bis zu einem gesonderten strengeren Auslieferungsvertrag ausdrücklich bestehen.

**Abwägung:** Den aktuellen Live-Datenstand beizubehalten ist die kleinere V1-Lösung, erfordert aber weiterhin den bestehenden Autosave-Hinweis. Sie erfüllt kein Versprechen „erst nach Prüfung öffentlich“. Empfehlung: Revisionen als Richtung wählen und vor kontrollierten Importübernahmen umsetzen. Das ändert die Semantik gegenüber dem heutigen Stand und benötigt Kevins ausdrückliche fachliche Entscheidung; kein stilles zusätzliches Gate-Kriterium.

**Spätere Abnahme:** Entwurfsänderung lässt veröffentlichten Text und Dateien unverändert; konkurrierende Änderung an Formular, Hersteller, Bild oder Dokument blockiert veraltete Freigabe; Rücknahme/Wiederveröffentlichung und Bereinigung funktionieren; A/B/anon sehen dieselbe aktive Revision. Altstände als „übernommen, Freigabeakteur unbekannt“ kennzeichnen, niemals rückwirkend eine Prüfung erfinden. Aufbewahrung, harte Löschung und erforderliche Widerrufsstrenge vor Implementierung festlegen.

## A5 – Bedeutung der dauerhaften Pass-ID

**Ist:** `products.id` ist die interne UUID. `public_id` ist eine unveränderliche, reservierte zwölfstellige Base58-Kennung. Artikelnummer/SKU/GTIN sind optionale Fachangaben; Artikelnummer ist kein eindeutiger Datenbankschlüssel. Technisch hängt der QR an einer Produktzeile, die fachliche Granularität ist noch nicht abschließend festgelegt.

**Vorschlag:** Ein V1-Produkt bezeichnet ein konkretes Modell mit einheitlichen öffentlichen Aussagen, nicht jedes physische Einzelstück. Eine Textkorrektur desselben Modells behält die Pass-ID. Eine Ausführung mit abweichender Zusammensetzung oder anderen widersprechenden Passangaben erhält ein eigenes Produkt mit eigener ID; spätere Familien/Varianten können diese verknüpfen. Chargen und Einzelstücke werden erst bei entsprechendem Nachweisbedarf eigene Entitäten.

Beispiel: Tippfehler bei einem unveränderten Baumwoll-Shirt korrigieren → gleiche ID. Eine neue Ausführung mit Polyesteranteil, während alte Shirts weiter im Umlauf sind → eigene ID. Eine Revision darf keinen alten gedruckten Code stillschweigend zu einem anderen Produkt umdeuten. Farbe/Größe benötigen eine eigene Identität, wenn die damit verbundenen öffentlichen Aussagen unterschiedlich sind; die konkrete Zuordnung im ersten Pilotfall entscheiden.

**Abwägung:** Ein eigener Datensatz pro Stück wäre für den bisherigen V1-Zweck zu aufwendig. Ein einziger Pass für beliebige Varianten wäre dagegen missverständlich. Das Modell ist eine Produktempfehlung, keine Aussage über regulatorisch vorgeschriebene Granularität.

**Spätere Abnahme:** Alte QR-IDs bleiben stabil und werden auch nach Löschung nie neu vergeben. Import ordnet Produkte innerhalb eines Herstellers nachvollziehbar zu; gleiche optionale Artikelnummer führt nicht automatisch zum Zusammenführen. Modell-/Variantenregel vor dem ersten Kundendruck an echten Beispielen bestätigen.

## Belegstellen und nächster Einstieg

Gezielt gelesen: `docs/PRODUKTVISION.md`; `docs/ROADMAP.md` (Architekturgrundlagen und spätere Erweiterungen); `docs/ANALYSE-2026-09-10.md` (E-A bis E-F); `docs/ABSCHLUSS-2026-09-18-N3.md`; `lib/services/products.ts` (`saveProdukt`, `getOeffentlicherPass`, `getVorschauPass`); `lib/services/manufacturers.ts`; `lib/services/public-files.ts` (`getPublicFile`); `lib/services/documents.ts`; `lib/services/upload-completion.ts`; `lib/types/database.types.ts`.

Maßgebliche Migrationen: `20260815163420_hersteller.sql`, `20260815164025_produkt.sql`, `20260903120000_public_id_und_produktpass_fix.sql`, `20260914120000_veroeffentlichungsregeln.sql`, `20260915210000_uploadvertrag_produktbild.sql`, `20260916120000_editor_konfliktschutz.sql` unter `supabase/migrations/`.

Nächster Schritt: Kevin entscheidet A1–A5 als Richtung, besonders A4 (Live-Bearbeitung versus separate Freigabe) und A5 (Modellgrenze vor Kundendruck). Annahme dieser Vorlage allein startet keine große Implementierung. Danach verbleibende N8-Nachweise und lokalen Gesamtsystemcheck gezielt planen; Ausbaupakete erst an den oben genannten Auslösern beginnen. Vor jedem nächsten Block Git-Stand und lokale Änderungen prüfen.

In diesem Block ausschließlich Dokumentation ergänzt und Belegstellen geprüft. Vorhandene uncommittete N8-Dateien erhalten. Keine neuen Laufzeitprüfungen, Serverstarts, Migrationen, Commits, Pushes oder Deployments; aus historischen Testergebnissen wird keine neue Systemabnahme abgeleitet.
