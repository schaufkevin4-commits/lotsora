# Lotsora: Wettbewerb und gemeinsame Seitenstruktur

Stand: 22.09.2026. Auftrag: Wettbewerber ansehen, Möglichkeiten zur Abhebung
einschätzen und die Seiten übersichtlicher sowie einheitlicher strukturieren.
Die vorher vereinbarte Reihenfolge bleibt bestehen: Struktur und Bedienung
zuerst, finale visuelle Gestaltung später. P2-6 ist noch nicht abgenommen.

## Was der Wettbewerbsvergleich tatsächlich zeigt

Verglichen wurden öffentlich zugängliche Produktbeschreibungen und Dokumentation,
keine angemeldeten Kundenoberflächen. Anbieterangaben sind keine unabhängigen
Wirksamkeitsnachweise. Daraus lässt sich weder ableiten, dass die Konkurrenz
schwer bedienbar ist, noch dass Lotsora bereits schneller oder einzigartig ist.

| Anbieter | Öffentlich beschriebener Schwerpunkt | Konsequenz für Lotsora |
|---|---|---|
| [Retraced](https://www.retraced.com/) | Vernetzte Lieferketten-, Lieferanten-, Material- und Nachweisdaten für die Textilbranche | Ein überschaubarer Produktpass-Ablauf für kleine Firmen ist ein möglicher engerer Fokus. Lotsora ersetzt diese umfassenden Prozesse derzeit nicht. |
| [TrusTrace](https://trustrace.com/solutions/digital-product-passport-dpp-compliance) | Produktdaten über den Lebenszyklus verbinden; DPP-Datenbasis, Schnittstellen und Verbraucherzugang | QR-Code und öffentliche Passansicht allein sind keine tragfähige Abhebung. |
| [PicoNext](https://support.piconext.com/article/digital-product-passport-commerce-overview/) | Shopify-Anbindung mit Erstellung und Bearbeitung von DPP-Entwürfen sowie QR-Download | Auch einfache Einstiege gibt es bereits. Lotsora muss den Nutzen für seine konkrete Zielgruppe nachweisen. |

**Empfohlene Positionierung als zu prüfende Hypothese:** Kleine deutschsprachige
Textilfirmen gelangen ohne aufwendige Einrichtung zu einem verständlichen,
bewusst freigegebenen Produktpass. Sie erkennen jederzeit den nächsten Schritt,
fehlende Angaben und den Unterschied zwischen internem Entwurf und öffentlichem
Stand. Keine neue Marktentscheidung oder Compliance-Garantie daraus ableiten.

Wettbewerbsfähig wird diese Richtung durch einen nachweisbar hilfreichen Ablauf,
nicht allein durch eine andere Farbe oder weniger Kästen. In Nutzertests prüfen:
Kann eine Zielperson ohne Anleitung ein Produkt anlegen, Pflichtangaben erkennen,
eine private Änderung von der Veröffentlichung unterscheiden und den QR-Code
finden? Zeit, Rückfragen, Fehlversuche und Stellen mit Unsicherheit beobachten.
Keine unbelegten Zeitversprechen in die Oberfläche oder Vermarktung aufnehmen.

## Umgesetzte gemeinsame Struktur

- Gemeinsamer Seitenkopf: Kontext, eindeutiger Titel, kurze Orientierung,
  passende Hauptaktion. Umbruch auf schmalen Ansichten.
- Einheitlicher Arbeitsbereich mit aktiver Navigation für Dashboard, Produkte,
  Firmenprofil, Team und Konto; derselbe Rahmen bei der Firmenneuanlage.
- Dashboard: Kennzahlen verlinken auf Statusfilter; eine konkrete Fortsetzung
  statt mehrerer konkurrierender Einführungen. Detailprüfung freiwillig aufklappbar.
- Produkte: Namenssuche, Statusfilter, klarer Leerzustand und Zurücksetzen.
  Sortierung erhält die Filter; am Handy bleiben Name, Status und Datum sortierbar.
- Editor: bestehende drei Bereiche bleiben erhalten; gemeinsamer Seitenkopf.
  Der Tastatursprung zum Hauptinhalt ändert den ausgewählten Bereich nicht mehr.
- Firmenprofil: öffentliche Angaben zuerst, interne Kontaktdaten aufklappbar.
  Eingeklappte Werte werden weiterhin gespeichert. Hinweis zur bewussten
  Veröffentlichung korrigiert; keine automatische öffentliche Profiländerung.
- Team: Mitglieder zuerst; Einladung sowie Zugangs-/Rollenaktionen aufklappbar.
  Vorhandene Bestätigungen und Berechtigungen bleiben erhalten.
- Konto: bestehender vereinfachter Löschablauf im gemeinsamen Rahmen.
- Anmeldung, Registrierung, Registrierungsbestätigung, Passwortseiten,
  Einladung und Löschbestätigung: gemeinsamer Zugangsrahmen und Titelaufbau.
- Öffentlicher Pass und private Vorschau: dieselben geordneten Abschnitte,
  benannte Sprungziele und kurze Inhaltsnavigation nur zu vorhandenen Daten.
  Die Vorschau bietet einen Rückweg zur Veröffentlichung. Öffentliche Besucher
  erhalten keine Verwaltungsnavigation; die feste Pass-Reihenfolge bleibt erhalten.
- Startseite und Datenschutz: abgestimmte Titel/Abstände; Startseite bleibt
  Aufbau-Platzhalter, Datenschutzinhalt unverändert. Fehler-, Lade- und
  Nicht-gefunden-Zustände in die gemeinsame Struktur aufgenommen.

Gemeinsam heißt gleiche Orientierung, nicht derselbe Inhalt auf jeder Seite.
Breite Listen und schmalere Formulare nutzen denselben linken Inhaltsbeginn;
öffentliche Leseseiten haben einen eigenen passenden Rahmen.

## Nachweise und Grenzen

- 141 bestehende Unit-Tests bestanden.
- ESLint, TypeScript und abschließender Produktionsbuild bestanden.
- 11 Produktions-HTTP-Tests bestanden, einschließlich öffentlichem Pass,
  Datenabgrenzung und Auth-/Fehlerverhalten.
- Live-Browser: Dashboard, Produktliste, Editor/Vorschau, Profil, Team und Konto.
  Namenssuche unabhängig von Großschreibung; Statusfilter, Filtererhalt beim
  Sortieren, erfolglose Suche und mobile Datumsortierung geprüft.
- Internen Testkontakt eingetragen, Abschnitt zugeklappt, gespeichert und nach
  Neuladen wiedergefunden. Teameinladung erreichbar, keine Einladung verschickt.
- Öffentlicher Pass zeigt weiter den freigegebenen Namen; die Vorschau zeigt
  den abweichenden Entwurf. Abschnittslink und Rückweg zur Veröffentlichung
  sowie Tastatursprung ohne Bereichswechsel geprüft.
- Gemeinsamer Aufbau auf allen Zugangsseiten, Firmenanlage im Zustand
  bestehender Mitgliedschaft, Einladung, Löschbestätigung, Datenschutz,
  Aufbau-Startseite und 404 im Browser geprüft.
- Desktop und 320 Pixel; Stichproben ohne horizontale Seitenüberbreite.
  Temporäre Bildschirmgröße wieder zurückgesetzt.

Keine neue Migration, Geschäftsregel, Berechtigung oder Veröffentlichung.
Die 154 Integrationstests aus P2-4 sind ein vorheriger Fachnachweis; kein neuer
vollständiger Integrationslauf für diese Oberflächenänderung. Nicht jede
Kombination aus Fehlerzustand und Rolle erneut im Browser durchgespielt.
Browser-/DOM-Prüfung ersetzt keinen echten Screenreader-Test.

## Nächster Einstieg

Den jetzt durchgängigen Aufbau mit Kevin beurteilen und offene Bedienprobleme
beheben. Danach finale Gestaltungsrichtung abstimmen und umsetzen. Anschließend
P2-5-Druckscan/echten Screenreader, Regression/CI und Kundenabnahme durchführen.
Positionierung mit Zielkunden prüfen; Import und KI bleiben eigene spätere Pakete.
LP-002: Phase 6, formal 27/40, Tag 28 weiterhin offen. Kein neuer Lerntag,
keine Kunden-/Cloudfreigabe. Lotsora nur lokal sichern; kein Push/Deployment.
Brain-KI bleibt Arbeitsbasis und wird im selben Abschluss synchronisiert.
