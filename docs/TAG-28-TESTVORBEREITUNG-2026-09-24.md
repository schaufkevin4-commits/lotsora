# Lotsora – Tag 28: Testdaten und Soll-Ergebnisse

**Aktueller Einstieg 24.09.2026:** Praktischer Lotsora-Aufbau, keine automatischen Quiz-/Lernpakete. Tag 28 Testvorbereitung abgeschlossen: sechs Produkte, zwei Firmen, sechs Rollen, 26 Soll-Szenarien; 13 Katalogprüfungen bestanden. Die 26 Abläufe wurden noch nicht ausgeführt. Fortschritt 28/40 (70 %). Nächster Schritt Tag 29: Fehleranalyse/Stabilisierung und Regression/CI; danach abgestimmtes Design, erneute UI-/QR-/Screenreader-Prüfungen und ausdrückliches Tag-30-Gate. Keine Kunden-/Cloud-Freigabe, kein Push/Deploy. Ältere Einstiegsangaben unten sind historisch.

Stand: 24.09.2026. LP-002, Phase 6 „Test & Stabilisierung“.

**Status: Vorbereitung erstellt. Die 26 Ablaufprüfungen sind nicht ausgeführt.** Der Datenkatalog ist noch nicht in die App geladen. Er erweitert die fachliche Testvorbereitung; bestehende Tests decken Teilbereiche ab, beweisen aber nicht automatisch jeden hier beschriebenen Ablauf. Tag 28 ist als praktische Testvorbereitung abgeschlossen; 28/40 Arbeitsschritte (70 %).

## Ziel und Reihenfolge

Vor dem nächsten Prüflauf festhalten: Wer arbeitet mit welchen Daten, welche Aktion erfolgt und welches Ergebnis muss sichtbar sein? So wird „funktioniert“ überprüfbar.

Tag 28 Vorbereitung → Tag 29 Stabilisierung/Regression/CI → eigener gemeinsam abgestimmter Designblock → erneute UI-Regression und echte QR-/Screenreader-Nachweise → Tag 30 MVP-Kriterien/Verständlichkeit und Gate. Phase 7 folgt erst nach Freigabe. P3 bleibt das separate Vor-Livegang-Paket.

Kevin bestätigt am 24.09. die grundsätzliche Funktionsfähigkeit des gezeigten Aufbaus. Beispiel 1 gefällt als Richtung; die spätere professionelle Gestaltung ist noch nicht festgelegt. Daraus folgt keine pauschale Abnahme aller technischen Einzelfälle oder von P2-4.

## Synthetischer Datenbestand

Zwei fiktive Firmen, sechs Rollen und sechs Produkte. Kein existierendes Unternehmen, keine echten Kontaktdaten, keine Zertifizierungsaussagen. Die IDs A01 usw. sind Katalogkürzel, keine Datenbank-UUIDs oder öffentlichen Pass-IDs.

| Kürzel | Firma/Produkt | Ausgangslage | Erwartung |
|---|---|---|---|
| A01 | Nordfaden: Basic Shirt | 100 % Baumwolle, vollständig, Artikel 000128 | Entwurf, veröffentlichbar |
| A02 | Nordfaden: Hoodie Alltag 80/20 | 80 % Baumwolle, 20 % Polyester; bereits freigegeben | Ausgangspunkt für private Änderungen und erneute Freigabe |
| A03 | Nordfaden: Leinenbluse | Beschreibung nur Leerzeichen | Unvollständig; nicht veröffentlichbar |
| A04 | Nordfaden: Wollschal | 90 % Wolle, sonst vollständig | Hinweis unter 100 %, trotzdem veröffentlichbar |
| A05 | Nordfaden: Hoodie Alltag 70/30 | Eigenes physisches Modell | Eigene öffentliche ID erforderlich |
| B01 | Fadenwerk: Basic Shirt | Name/Artikelnummer wie A01, andere Firma, veröffentlicht | Gleiche Bezeichnung gibt keine internen Zugriffsrechte |

Rollen: Owner A, Mitglied A, Owner B, entferntes Mitglied A, bestätigtes Konto ohne Firma, anonymer Leser. Entferntes Mitglied und firmenloses Konto werden in getrennten Szenarien hergestellt.

Dateien für A02: gültige synthetische Pflege-PDF (freigegeben), Kalkulations-PDF (intern), selbst erzeugtes PNG (Produktbild). Der JSON-Katalog beschreibt diese Dateien, enthält aber keine Binärdateien. Grenzdateien müssen tatsächlich die angegebenen Bytes und gültigen Inhalte haben; bloß umbenannte Dateien gelten nicht als gültige PDF/Bilder.

## Testfälle

**Ausführungsstatus aller folgenden Fälle: nicht ausgeführt.** Die letzte Spalte verweist auf vorhandene Teilabdeckung unter tests/integration; sie ist keine neue Erfolgsmeldung.

| Fall | Rolle/Daten | Aktion | Soll-Ergebnis | Vorhandene Teilabdeckung / späterer Nachweis |
|---|---|---|---|---|
| T28-01: Konto und Firma | noCompany; A01 | Bestätigtes Konto ohne Firma: leeren Zustand öffnen und eigene Firma einmal anlegen. Separat Einladung annehmen. | Beide vorgesehenen Einstiege funktionieren. Kein versehentliches Zweitunternehmen; wiederholtes Anlegen bleibt kontrolliert. | company-entry.test.ts |
| T28-02: Anlegen und Speichern | ownerA; A01 | Produkt mit führenden Nullen der Artikelnummer speichern, Seite neu laden. | Eingaben bleiben erhalten, Artikelnummer 000128 bleibt Text. Vollständiger Entwurf ist noch nicht öffentlich. | uploads.test.ts;publication.test.ts |
| T28-03: Fehlendes Pflichtfeld | ownerA; A03 | Unvollständige Beschreibung speichern, Veröffentlichung versuchen. Jeweils Name/Kategorie zusätzlich separat leer prüfen. | Privater unvollständiger Entwurf ist möglich; Veröffentlichung wird mit verständlichem Hinweis verhindert. Leerzeichen zählen als leer. | publication.test.ts |
| T28-04: Materialgrenzen | ownerA; A01 | M01–M05 jeweils in frischem Szenario anwenden; NaN/Infinity gesondert direkt an der Servicegrenze prüfen. | Ungültige Einzelwerte, Summe über 100 und Rundungsüberlauf werden abgewiesen; letzter gültiger gespeicherter Stand bleibt erhalten. | publication.test.ts;publication-concurrency.test.ts |
| T28-05: Materialhinweis | ownerA; A04 | 90 Prozent anzeigen und Veröffentlichung prüfen; danach leere Materialliste M06 separat prüfen. | Unter 100 Prozent erscheint ein Hinweis, kein Veröffentlichungsverbot. Pflichtfelder bleiben unabhängig davon erforderlich. | publication.test.ts |
| T28-06: Firmentrennung | ownerB; A01 | Direkte Produkt-ID, Listenabfrage, Änderungs- und Löschversuch auf Firma A; Gegenrichtung separat. | Keine privaten Fremddaten und keine Fremdänderung; identische Namen/Artikelnummern schaffen keine Berechtigung. | access.test.ts;teams.test.ts |
| T28-07: Teamrollen | memberA; A02 | Eigenes Firmenprodukt bearbeiten und freigeben; Firmenprofil/Einladungen/Verantwortungswechsel versuchen. | Mitglied darf Produktarbeit; Owner-Verwaltung bleibt gesperrt. Keine nicht beschlossene Vieraugenpflicht erwarten. | teams.test.ts;gate-actions.test.ts |
| T28-08: Rechteentzug | removedA; A02 | Owner entfernt Mitglied; bestehende Sitzung versucht erneutes Laden, Speichern und Dateiabruf. | Neue Zugriffe gesperrt. Bereits angezeigte Inhalte werden nicht rückwirkend aus dem Browser gelöscht. | teams.test.ts;product-write-boundary.test.ts |
| T28-09: Dateiupload | ownerA; A02 | Gültige PDF/JPEG/PNG/WebP laden; echte Dateien mit 10 MiB und 10 MiB + 1 Byte sowie HTML mit PDF-Endung prüfen. | Erlaubter Inhalt bis einschließlich 10 MiB zulässig; Übergröße und falscher Inhalt abgelehnt. Als Produktbild nur Bildformate. Keine kaputten Verweise zurücklassen. | uploads.test.ts |
| T28-10: Öffentlicher Pass | anon; A02 | Pass und Metadaten ohne Sitzung, mit A- und B-Sitzung vergleichen. Interne Marker gezielt suchen. | Alle sehen denselben freigegebenen Stand. Keine interne Artikelnummer, Kontaktdaten, Adresse, Dokumentnotizen, Quell-URLs oder privaten Entwürfe. Leere optionale Abschnitte fehlen. | public-http.test.ts;access.test.ts |
| T28-11: Private Änderungen | ownerA; A02 | Beschreibung, Bild, Dokumentauswahl und öffentliche Firmenangaben privat ändern; anon parallel neu laden. | Privater Stand ändert sich; gesamter bisher freigegebener Pass bleibt unverändert, einschließlich Firma und Dateien. | publication-revisions.test.ts |
| T28-12: Bewusste Freigabe | ownerA; A02 | Aktuellen Entwurf samt Dateien prüfen und explizit veröffentlichen. | Pass übernimmt den neuen Gesamtstand atomar; öffentliche ID bleibt gleich. Kein historisches Versionsarchiv voraussetzen. | publication-revisions.test.ts;public-http.test.ts |
| T28-13: Unvollständiger neuer Entwurf | ownerA; A02 | Beim veröffentlichten Produkt privat Beschreibung leeren und speichern; erneut veröffentlichen versuchen. | Alter öffentlicher Stand bleibt vollständig erreichbar. Neue Freigabe wird blockiert, veröffentlichter Produktstatus fällt nicht automatisch zurück. | publication-revisions.test.ts |
| T28-14: Dateiersatz | ownerA; A02 | Freigegebenes Bild/Dokument privat ersetzen oder abwählen; alten öffentlichen Pass öffnen; danach neu freigeben. | Bis zur erneuten Freigabe bleiben benötigte alte Dateien nutzbar. Danach werden nicht mehr benötigte Dateien kontrolliert bereinigt. | publication-revisions.test.ts |
| T28-15: Zurückziehen und Wiederfreigeben | ownerA; A02 | Pass zurückziehen, neue Datei-Links anfordern, später wieder freigeben. | Pass wird nicht verfügbar; keine neuen freigegebenen Links. Bereits signierte Links können bis 300 Sekunden auslaufen. Wiederfreigabe nutzt gleiche ID. | public-pass.test.ts;public-http.test.ts |
| T28-16: Zwei Bearbeiter | memberA; A02 | A und Mitglied öffnen dieselbe Version. A speichert; Mitglied speichert alten Stand. | Veralteter Schreibversuch meldet Konflikt; neuere Daten bleiben erhalten. Nicht automatisch mit neuer Version erneut senden. | editor.test.ts;product-write-boundary.test.ts |
| T28-17: Freigabe während Änderung | ownerA; A02 | Freigabe prüfen; anschließend vor Bestätigung Firma/Dokument/Produkt in zweiter Sitzung ändern. | Veraltete Prüfung darf keinen ungeprüften neuen Gesamtstand freigeben; Aktualisieren und erneut prüfen erforderlich. | publication-revisions.test.ts;publication-concurrency.test.ts |
| T28-18: Teilfehler und Rollback | ownerA; A01 | Kontrollierten Fehler beim mehrteiligen Speichern auslösen. | Keine Mischung aus altem und neuem Produkt/Material/Textil/Nachhaltigkeitsstand; Versionsstand bleibt konsistent. | editor.test.ts;publication-concurrency.test.ts |
| T28-19: Öffentliche Identität | ownerA; A05 | A02 korrigieren, dann A05 als eigenes physisches Modell anlegen. B01 zusätzlich vergleichen. | Korrektur behält ID; neues Modell und fremdes gleichnamiges Produkt erhalten eigene IDs. Keine IDs aus Namen ableiten. | public-id.test.ts |
| T28-20: Produktlöschung | ownerA; A02 | In frischem Szenario Produkt löschen, öffentlich öffnen und neue Produkte anlegen. | Produkt/Pass nicht mehr nutzbar; zugehörige Dateien bereinigt. Alte öffentliche ID bleibt reserviert und wird nicht wiederverwendet. | deletion.test.ts;public-id.test.ts |
| T28-21: Bereinigungsfehler | ownerA; A02 | Storage-Löschung gezielt fehlschlagen lassen, danach Wiederholung zulassen. | Ausstehende Arbeit bleibt nachvollziehbar und wiederholbar; keine verlorenen Dateiverweise und kein falsches Alles-erledigt-Signal. | deletion.test.ts;deletion-concurrency.test.ts |
| T28-22: Konten und Verantwortung | ownerA; A02 | Mitglied löscht eigenes Konto; letzter Owner versucht Selbstlöschung/Übertragung; firmenloses Konto separat löschen. | Andere Firmenkonten bleiben unberührt, Firma wird nicht versehentlich verwaist. Vorgesehener Bestätigungs- und Verantwortungsablauf greift. | account-deletion.test.ts;teams.test.ts |
| T28-23: Anmeldung und Einladung | noCompany; A01 | Unbestätigten Zugang sowie ungültigen/abgelaufenen/benutzten Einladungslink testen; gültigen Link separat. | Geschützte Daten bleiben geschützt; gültiger lokaler Mailablauf funktioniert, ungültige Links geben verständliche Rückmeldung. | public-http.test.ts;company-entry.test.ts |
| T28-24: QR und echte Bedienprüfung | anon; A02 | Nach finalen UI-Änderungen QR herunterladen, physisch ausdrucken und per Handy scannen; echten Screenreader und Tastatur separat prüfen. | QR erreicht richtige öffentliche ID; Navigation, Beschriftungen und Status verständlich. Echte Geräte-/Screenreader-Nachweise dokumentieren. | MANUELL: P2-5, nach Design |
| T28-25: Nicht verfügbar und Störung | anon; A03 | Privaten, unbekannten, zurückgezogenen Pass sowie gezielten DB-Timeout vergleichen. | Private Inhalte bleiben geheim. Nicht verfügbare Pässe werden neutral behandelt; temporäre technische Störung wird gemäß bestehendem HTTP-Vertrag behandelt. | public-http.test.ts |
| T28-26: MVP und Nutzenverständnis | ownerA; A01 | Anlegen → speichern → Daten/Dokumente verwalten → bewusst veröffentlichen → QR → öffentlichen Pass als zusammenhängenden Ablauf prüfen. Später Testkunde erklärt Nutzen. | Sechs MVP-Erfolgskriterien getrennt belegen. Technischer Durchlauf ersetzt kein tatsächliches Kundenverständnis. Gate erst Tag 30 ausdrücklich entscheiden. | MANUELL: Tag 30/Kundentest; bestehende Fachtests als Teilnachweis |

## Wiederholbare isolierte Durchführung

1. Ausschließlich lotsora-integration auf 127.0.0.1:55321 verwenden. Der bestehende Testhelfer akzeptiert eigene LOTSORA_TEST-Schlüssel und kein stilles .env.local-Fallback. Keine Cloud-/Kundendaten und kein Reset.
2. tests/integration/fixtures.ts erzeugt bereits zwei synthetische Firmen, bestätigte Konten, Produkte und gültige PDF-Testdaten. Diese Grundfixture enthält **nicht** automatisch die sechs Katalogprodukte. Pro Szenario benötigte Datensätze gezielt ergänzen; keine globale Dauersaat.
3. Laufkennung und konkrete erzeugte UUIDs zu Katalogkürzeln protokollieren. Konten nur mit synthetischen Adressen unter example.invalid im lokalen Mailcatcher. Mitglieder über create_company_invitation/accept_company_invitation herstellen; entzogenes Mitglied in eigenem Szenario entfernen.
4. Produkte über vorhandene Versionierungswege vorbereiten (tests/integration/product-write.ts: saveFixtureProduct/publishFixtureProduct). Dateien über echte Upload-Pipeline erzeugen und binden. Service-Schlüssel dienen nur Setup, Fehlersteuerung, Kontrolle und Cleanup, niemals dem Beweis normaler Benutzerrechte.
5. Jede Ablaufprüfung beginnt mit frischen Daten. Löschung, Entzug und Rücknahme nicht unkontrolliert auf den Ausgangsbestand anderer Fälle anwenden. Bei Konflikttests die alte Version ausdrücklich behalten; kein automatisches Nachladen im Schreibhelfer verstecken.
6. Ausführung mit normalen Rollen/anon prüfen und Ist-Ergebnis erfassen. Bei Uploadgrenzen 10 MiB = 10.485.760 Bytes verwenden. Signierte Links bis maximal 300 Sekunden Restlaufzeit gesondert betrachten.
7. Im finally-Block f.cleanup() verwenden; nur erzeugte Konten, Firmen, Dateien und zugehörige Jobs bereinigen. Cleanup-Fehler separat dokumentieren. Datenbank-Reset ist kein Cleanup.

Die Anbindung des zusätzlichen Katalogs an automatisierte Abläufe gehört in Tag 29. Tag 28 liefert den überprüfbaren Soll-Bestand. Die üblichen npm-Testbefehle importieren diesen JSON-Katalog derzeit nicht.

## Ergebnisprotokoll für den späteren Prüflauf

Je Fall: Test-ID, Datum, Code-Commit, isolierte Umgebung, Laufkennung, Rolle, erzeugte IDs, Ist-Ergebnis, bestanden/fehlgeschlagen/blockiert, Beleg und Cleanup-Ergebnis. Bei Abweichung zusätzlich Reproduktionsschritte und Auswirkung. Ein leerer Ergebnisbereich bedeutet **nicht getestet**, nicht bestanden.

Priorität: Zuerst Datenzugriff, öffentliche/privat getrennte Stände, Datenverlust und Dateien; anschließend restlicher Kernablauf; nach der Gestaltung Bedienung/QR/Screenreader. Tag 30 führt die Ergebnisse und die sechs MVP-Erfolgskriterien zusammen: Produkt anlegen, speichern, Daten/Dokumente verwalten, QR funktioniert, Pass öffentlich erreichbar, Testkunden verstehen den Nutzen.

## Nachweis dieser Vorbereitung

Quellbasis: Lotsora ce5cbe3cb2eed5ab516deec7231ac97ddc37d515; lib/services/products.ts; tests/integration/fixtures.ts; tests/integration/product-write.ts; die genannten Tests; P2-4-Umsetzung und Architektur A1–A5 vom September 2026; Brain-KI LP-002 PLAN.md und PassPilot/MVP.md. Neuere Team-/Freigaberegeln gehen älteren pauschalen Verschiebungsvermerken vor; geschützte Beschlussdateien werden dadurch nicht umgeschrieben.

Datenkatalog: [tag-28.json](testdaten/tag-28.json). Prüfung am 24.09.2026: 13 gezielte Katalogprüfungen bestanden (6 Produkte gegen die echten Pflichtfeld-, Status- und Materialfunktionen; 6 Materialmutationen; 1 Referenz-/Statusprüfung). Aufruf: `node node_modules/vitest/vitest.mjs run --config .local-tests/tag28-vitest.config.mts`. Die temporäre Prüfung verwendet lib/services/products.ts; kein Datenbankzugriff. Die 26 Ablaufprüfungen bleiben nicht ausgeführt. Anschließender Systemcheck: 141 Unit-Tests und ESLint bestanden (npm test; npm run lint). Kein neuer Integrations-/HTTP-/Browserlauf. Frühere 141 Unit-/154 Integrations-/11 HTTP-Nachweise vom 22.09. sind historische Nachweise und kein Ergebnis eines heutigen Gesamtlaufs.
