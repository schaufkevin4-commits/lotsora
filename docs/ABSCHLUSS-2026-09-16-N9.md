# N9/F07: Autosave, Navigationsschutz und Veröffentlichung

Stand: 16.09.2026. Lokaler Branch `codex/n9-autosave-veroeffentlichung`, Ausgangspunkt `cf0ed49`. Arbeits- und Haupt-Checkout waren sauber; GitHub-main wurde lesend auf denselben Commit geprüft. Kein Push, Merge, Cloud-Rollout oder lokales Gesamt-Gate wird durch diesen Block freigegeben.

## Ergebnis

- Autosave und Speichern verwenden dieselbe Steuerung. Ausgangsstand, gesendete Momentaufnahme und tatsächlich bestätigter Stand bleiben getrennt. Eine verspätete Antwort bestätigt ausschließlich die gesendeten Eingaben; neuere Änderungen werden anschließend gesichert. Doppelte Requests werden verhindert. Fehler und unklare Antworten bleiben sichtbar und stoppen automatische Wiederholungen. Nach einer Korrektur oder bewusstem erneuten Speichern ist ein neuer Versuch möglich; Versionskonflikte benötigen einen Abgleich.
- FormData wird eindeutig als geordnete JSON-Liste verglichen. Der Editor verwendet einen Submit-Handler statt einer automatisch zurückgesetzten React-Form-Action; während eines Saves eingegebene Werte bleiben erhalten.
- Materialstrukturänderungen melden sich nach dem DOM-Update bei der Speichersteuerung. Eine einzelne oder die letzte Zeile lässt sich entfernen. Eine leere Liste bleibt gemäß B4 zulässig; weniger als 100 % ist weiterhin ein Hinweis, mehr als 100 % bleibt gesperrt.
- Veröffentlichung, Rücknahme und Vorschau warten auf einen bestätigten Formularstand. Während des Statuswechsels sind die Formulareingaben gesperrt. Die Veröffentlichung wird nicht automatisch nach einem Save ausgelöst: Die bewusste Nutzeraktion bleibt erforderlich. Fehler eines Statuswechsels erklären einen bestätigten Formularstand nicht fälschlich für ungespeichert. Löschen wird bei offenen Formularänderungen/laufenden Saves blockiert.
- Links, Logout und Dokumentwechsel erhalten einen Schutz für offene Änderungen; Browser-Zurück/Vorwärts wird über abbrechbare Navigation-API-Ereignisse geschützt. Ein bestätigtes Verlassen stoppt geplante Autosaves. Bereits laufende Servertransaktionen können nach dem Verlassen noch abschließen.
- Veraltete Tabs erhalten einen verständlichen Konflikt, behalten ihre Eingaben und können den aktuellen Serverstand in einem zweiten Tab vergleichen. Kein automatisches Überschreiben oder stilles Neuladen.

## Datenbankvertrag

Neue Migration: `20260916120000_editor_konfliktschutz.sql`. Insgesamt **20 Migrationen**, ausschließlich auf `lotsora-integration` (API 55321, DB 55322).

`products.editor_version` ist ein Bearbeitungstoken, keine gespeicherte Veröffentlichungsrevision. Es ändert sich bei Basis-/Artikel-/Statusänderungen und bei Material-, Textil- und Nachhaltigkeitsänderungen. Die bestehenden B4-Produktsperren bleiben erhalten und umfassen nun auch die beiden 1:1-Formularbereiche. Bild- und Dokumentaktionen behalten ihre eigenen B3/B5-Verträge; sie sind nicht Bestandteil dieses Formulartokens.

`save_product_checked` prüft den erwarteten Token unter derselben Produktsperre wie der vollständige B5-Save und gibt die endgültige Version zurück. `set_product_publication_checked` verwendet dieselbe Prüfung vor Veröffentlichung/Rücknahme. Direkte Änderungen an den Formularbereichen machen bereits geladene Tabs ebenfalls veraltet. Ungültige Transaktionen rollen Daten und Token gemeinsam zurück. RLS und Eigentumsprüfung gelten weiterhin; anon erhält keine neuen Feldrechte.

Die bisherigen RPCs bleiben für ihre vorhandenen Verträge erhalten; alte direkte Clients ohne erwarteten Token besitzen dadurch keinen neuen Schutz vor fachlich gültigem Überschreiben. Der aktuelle Editor nutzt ausschließlich die geprüften Varianten. App und neue Migration müssen bei einer späteren Übernahme zusammenpassen; bestehende Editor-Tabs dann neu laden. Das normale Entwicklungsprojekt und Cloud wurden weder migriert noch zurückgesetzt. Datenbanktypen wurden aus der isolierten Testinstanz regeneriert.

Der Editor liest seine Formularbereiche mit einer anschließenden Tokenkontrolle. Falls sich während der Abfragen etwas ändert, wird begrenzt erneut gelesen; dadurch wird kein gemischter Ausgangsstand still als bestätigt übernommen.

## UX-Abgleich PP-018/019

Die Originalentscheidungen und MVP wurden lesend auf dem bereits dokumentierten Brain-KI-Commit `0439b2c56b296e6951f0c5f5234d4bf918dcf273` abgeglichen:

- PP-018 E3: Checkliste bleibt auch nach dem ersten Entwurf sichtbar, solange aktuell kein Produkt veröffentlicht ist. Eine historische Erstveröffentlichung wird nicht separat gespeichert; nach Rücknahme aller Pässe erscheint sie wieder.
- PP-018 E5: drei Dashboard-Kacheln bleiben erhalten; letzte Änderungen und interne Datenlücken sind sichtbar.
- PP-019 E1/E3: Neuanlegen öffnet fünf geführte Formularschritte in bestehender Reihenfolge. Alle Abschnitte sind jederzeit erreichbar; späteres Bearbeiten nutzt klappbare Abschnitte. Verdeckte Schritte bleiben im Formular und werden mitgespeichert. Danach folgen Dokumente, Vorschau und aktive Veröffentlichung.
- PP-019 E2/E4: Autosave plus sichtbarer Knopf, bestätigte Vorschau und koordinierte Veröffentlichung umgesetzt.
- Die dreistufige interne Vollständigkeitsanzeige ist konkret begrenzt: fehlende Pflichtdaten = unvollständig; vollständige Pflichtdaten mit Lücken in Material (100 %), Herkunft, Pflege oder Kreislauf = teilweise vollständig; alle genannten Gruppen vorhanden = vollständig. Pflege berücksichtigt Pflege- oder Waschhinweise, Kreislauf mindestens Recycling-, Reparatur- oder Entsorgungshinweise. Die Kriterien werden in der Oberfläche benannt. Optionale Gruppen bleiben freiwillig und erzeugen keine neuen Veröffentlichungspflichten, fachliche Prüfung oder Compliance-Aussage.

Quellen: [PP-018/019](https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/PassPilot/ENTSCHEIDUNGEN.md), [MVP](https://github.com/schaufkevin4-commits/Brain-KI/blob/0439b2c56b296e6951f0c5f5234d4bf918dcf273/PassPilot/MVP.md). Keine Änderung im Brain-KI-Repository.

## Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Unit-/Regressionstests, endgültiger Stand | 75 bestanden; 11 neue Fälle für die Speichersteuerung |
| Vollständige Integration | 78 bestanden; acht neue N9-Fälle mit echtem isoliertem Supabase |
| Lint, TypeScript, Produktionsbuild | bestanden; Next.js 16.3.5, 14 statische Seiten; bekannte Middleware-Deprecation unverändert |
| Sichtbarer Browser, Produktionsbuild auf 127.0.0.1:3107 | Autosave/manuelles Speichern, Zeilenentfernung inklusive letzter Zeile, Serverfehler mit Wiederholung, verzögerter Save mit Weitertippen, Navigation/Browser-Zurück, zwei Tabs, verzögerte Veröffentlichung, Rücknahme, geführter Entwurf → Vorschau → lokaler öffentlicher Pass |

Datenbanktests: endgültiger Bestätigungstoken; veralteter Save und Statuswechsel; direkte Änderungen aller drei Kindtabellen; fremde/anon-Zugriffe; Rücknahme mit neuer Version; Rollback bei spätem Artikelnummerfehler; zwei tatsächlich wartende Saves auf derselben Version, von denen genau einer gewinnt.

Browserdetails: Eine gezielte Produktsperre führte zum echten Save-Timeout. Der Editor behielt den Text, warnte beim Dashboard-Wechsel und Browser-Zurück, wiederholte nicht selbständig und speicherte nach bewusstem Klick erfolgreich. Ein ausschließlich für das synthetische Produkt installierter Drei-Sekunden-Trigger prüfte anschließend einen langsamen erfolgreichen Save: Eingabe B während Request A blieb erhalten und wurde nachgespeichert. Dasselbe Verfahren zeigte den gesperrten Statuswechsel. Testtrigger wurden entfernt. Tab B konnte Tab A nicht überschreiben. Alle Materialentfernungen wurden zusätzlich in der DB kontrolliert. Der geführte Testpass enthielt Name, Beschreibung, 100 % Leinen, Herkunft, Pflege und Reparatur; Vorschau und lokaler öffentlicher Pass zeigten diese Angaben. Keine Browserwarnungen/-fehler beim Abschluss dieses Ablaufs.

Die vollständige Integration lief nach der Migration; anschließend wurden nur Fehleranzeige, Konflikt-Hilfslink und die Ablage des unveränderten Status-RPC-Aufrufs in der Serviceschicht angepasst. Unit-Tests, Lint, Typen und Build wurden auf dem endgültigen Stand erneut geprüft; der Statuswechsel wurde dort gezielt erneut im Browser geprüft.

## Aussagegrenzen und offene Entscheidung

**Der öffentliche Pass liest weiterhin die aktuellen gespeicherten Daten eines veröffentlichten Produkts. Autosave kann daher öffentlich sichtbare Angaben ändern.** Das steht vor dem Formular und im Veröffentlichungsdialog. Getrennte Bearbeitungs-/Veröffentlichungsstände wurden weder beschlossen noch implementiert. Eine Änderung dieser Semantik bleibt Kevins gesonderte Entscheidung.

Kein Offline-/Crash-Recovery-Speicher und keine Garantie gegen erzwungenes Schließen, Prozessabbruch oder Browser, die Warnungen unterdrücken. Navigation-API-Zurück/Vorwärts hängt von Browserunterstützung und abbrechbaren Ereignissen ab; geprüft wurde der sichtbare Chromium-basierte In-App-Browser. Der automatische Reload-Test lieferte keinen eigenständigen belastbaren Dialognachweis; der beforeunload-Schutz ist implementiert, die breitere Browser-/Mobilabnahme bleibt N8/Systemcheck. Technische Grundlage: installierte Next.js-Guides zu Mutationen, Formularen und Navigation sowie [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API).

Bild-/Dokument-Uploads und deren eigene ungespeicherte Metadaten wurden nicht in eine allgemeine editorweite Transaktionssteuerung umgebaut. Ihre B3/B5-Verträge bleiben bestehen. Cacheaktualität, Linkgültigkeit und vollständige öffentliche Feldprüfung bleiben N3/F08. Vollständige Mobile-/Screenreader-/Restore- und Gesamt-Gate-Abnahme stehen aus.

## Abschluss und nächster Einstieg

Nach der letzten Browserprüfung wurden die synthetischen Daten bereinigt: jeweils null Konten, Hersteller, Produkte, Dokumente, Storage-Objekte und Dateivorgänge; kein temporärer Testtrigger. Der eigens gestartete Port-3107-Server und lotsora-integration wurden gestoppt. Volumes und reservierte öffentliche IDs bleiben erhalten. Bereinigungsnachweis und lokaler Commit stehen auch in der Ausgabe dieses Chats.

**Nach diesem Block Pause.** Kein weiterer Baublock automatisch. Nächster geplanter Einstieg nach neuem Auftrag: N3 (Aktualität, gemeinsame Passladung und funktionierende Datei-/Bildlinks); dann N8/QR/proxy und Systemcheck. Lerntag bleibt 27/40, lokales Gesamt-Gate bleibt offen. Künftige Pushes werden gesondert abgestimmt.
