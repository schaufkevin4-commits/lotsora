# Lotsora

**Tagesabschluss 22.09., nachgetragen am 23.09.2026:** Kevin hat die Übernahme und den Push des geprüften Stands nach main beauftragt. [Abschluss, Nachweise und Wiedereinstieg](docs/TAGESABSCHLUSS-2026-09-22.md). Die sieben lokalen Arbeitscommits einschließlich P2-2/P2-3/P2-4 und gemeinsamer P2-6-Struktur werden damit gesichert; ältere Hinweise „kein Push“ unten beschreiben den Stand vor diesem Auftrag. Testreste bereinigt und isolierte Testinstanz gestoppt, kein DB-Reset/Cloud-Apply. Kevin arbeitet vorübergehend am Brain-KI-Cockpit weiter. Nächster Lotsora-Einstieg: Gesamtaufbau beurteilen, danach finale Gestaltung. Nutzer-/Kundenabnahmen und Tag 28 bleiben offen.


**Neuester Strukturstand 22.09.2026:** P2-6 auf die Seitenfamilien übertragen: aktive gemeinsame Navigation, klare Seitenköpfe, fokussiertes Dashboard, Suche/Statusfilter, aufklappbare Profil-/Teamdetails, einheitliche Zugangsseiten und Pass-Inhaltsnavigation. [Wettbewerbsvergleich, Seitenumfang und Nachweise](docs/P2-6-SEITEN-UND-WETTBEWERB-2026-09-22.md). 141 Unit- und 11 Produktions-HTTP-Tests, Lint, Typen und Build bestanden; Desktop und 320 Pixel live geprüft. Gemeinsame Nutzerbeurteilung und spätere finale Optik offen. Wettbewerbliche Abhebung als Zielgruppen-/Bedienhypothese, nicht als bewiesenes Alleinstellungsmerkmal. Brain-KI synchronisieren; Lotsora lokal, kein Push/Deploy.

**Arbeitsstand 22.09.2026:** P2-4 ist lokal umgesetzt und live geprüft: Autosave ändert den privaten Entwurf; der vollständige öffentliche Pass wird erst bewusst aktualisiert. Bilder, Dokumentauswahl und Firmenangaben gehören zur Freigabe, benötigte Dateien bleiben erhalten. 141 Unit-, 154 Integrations- und 11 HTTP-Fälle bestanden; Lint, Typen und Build grün. [Umsetzung, Nachweise und Grenzen](docs/P2-4-UMSETZUNG-2026-09-22.md). P2-3 ist durch Fortsetzung bestätigt; Nutzerabnahme des neuen P2-4-Stands offen. Nächster Einstieg: P2-6 Designrichtung und Informationsdichte vorbereiten. Brain-KI bleibt die aktuelle Arbeitsbasis; LP-002 Phase 6, formal 27/40, Tag 28 offen. Lotsora nur lokal gesichert, kein Push/Deploy. Ältere Einstiegsangaben unten sind historisch.

**Tagesabschluss 20.09.2026, nach P2-1:** Kevin hat die live gezeigte Konto-/Firmenlöschung mit „top passt so“ abgenommen und den Push nach `main` beauftragt. Selbstbedienung einschließlich Kontoauswahl, Dateibereinigung und permanenter öffentlicher IDs umgesetzt; 148 Unit-, 120 Integrations- und 11 HTTP-Tests bestanden. Testvorschau und isolierte Testinstanz beendet, synthetische Konten/Firmendaten/Dateien entfernt. [Abnahme, Tagesabschluss und Betriebsgrenzen](docs/P2-1-UMSETZUNG-2026-09-20.md#tagesabschluss-und-abnahme), [aktueller Wiedereinstieg](docs/UEBERGABE-NACH-GATE-2026-09-20.md). Nächster offener Punkt: P2-2; eigener abgestimmter Designblock vor erstem Kundentest bleibt erforderlich. Keine Kunden- oder Cloud-Freigabe. Frühere „nächster Schritt“-Angaben unten sind historisch.

**Aktuell, 20.09.2026: Lokales Gate „MVP funktional vollständig“ durch Kevin freigegeben.** Browserabnahme einschließlich Profilverbesserung abgeschlossen; Übernahme und Push nach main ausdrücklich beauftragt. [Abnahmeprotokoll](docs/GATE-BROWSERABNAHME-2026-09-20.md), [verbindliche Restpunkte vor Kunde/Cloud](docs/RESTPUNKTE-GATE-2026-09-20.md) und [Übergabe für den nächsten Chat](docs/UEBERGABE-NACH-GATE-2026-09-20.md). Keine Kunden- oder Cloud-Freigabe. Druckscan und echte Screenreader-Stichprobe bleiben offen. Die nachfolgenden Fortschrittsmeldungen sind historisch.

**Manuelle Restabnahme 20.09.:** QR-Dateipaar unabhängig dekodiert; Kevin bestätigt Zoom-/Sprachausgabe-Stichprobe und Handyscan vom Bildschirm. [Nachweise](docs/N8-RESTABNAHME-2026-09-20.md). Als Nächstes die ausdrückliche lokale Gate-Entscheidung; physischer Ausdruckscan bleibt spätestens vor Kundeneinsatz offen. Ältere offene Einzelstatus unten sind historisch.

**Gesamtsystemcheck 20.09.:** 113 Unit-, 96 Integrations- und 11 Produktions-HTTP-Tests sowie Lint, Typen und Build bestanden. Echte lokale Auth-Mails geprüft und zwei Ablaufprobleme behoben. Gemeinsamer Produkt-/Datei-/Passablauf zweier Firmenmitglieder live gezeigt, Testprodukt samt Dateien gelöscht. [Prüfbericht und noch offene manuelle Nachweise](docs/SYSTEMCHECK-2026-09-20.md). Nächster Schritt: manuelle Restabnahme und ausdrückliche Gate-Entscheidung; noch kein Push/Cloud-Rollout. Ältere „nächster Block“-Angaben unten sind historisch.

Stand 20.09.: **Mehrere Benutzer derselben Firma sind lokal umgesetzt und geprüft**: Teamübersicht, Einladungen, gemeinsame Produkte/Dateien, Rechteentzug und geschützte Firmenverantwortung. Migration nur in der isolierten Testinstanz, noch kein Push/Cloud-Rollout. [Abschluss und Nachweise](docs/ABSCHLUSS-2026-09-20-FIRMENTEAMS.md), [Beschluss und Abnahmekriterien](docs/ARCHITEKTURBESCHLUSS-2026-09-20.md). Nächster Block: Gesamtsystemcheck und verbleibende manuelle Abnahme. Das Gesamt-Gate bleibt offen.

Tagesabschluss 19.09.: Echte PNG-/SVG-Downloads geprüft, Architekturvorlage A1–A5 ausgearbeitet. Kevin hat die Übernahme nach main und den Push beauftragt. [Aktuelle Übergabe und Einstieg morgen](docs/TAGESABSCHLUSS-2026-09-19.md). Fachliche Entscheidungen, N8-Restnachweise und Gesamt-Gate bleiben offen. Frühere Standangaben unten sind historisch.

Tagesabschluss 18.09.: N3/N8-Code in `9d4ad38` committed; main-Push ausdrücklich beauftragt. [Übergabe und Einstieg morgen](docs/TAGESABSCHLUSS-2026-09-18.md). N8-Restabnahme, Architekturentscheidungen und Gesamt-Gate bleiben offen. Ältere Angaben zum uncommitteten Stand sind historisch.

Textil-/Apparel-first-Anwendung für Produktdaten, Dokumente und öffentliche digitale Produktpässe. Langfristig soll daraus eine einfach bedienbare, KI-gestützte Produktdatenplattform werden. Die abschließende Prüfung und Veröffentlichung bleiben beim verantwortlichen Kunden; Lotsora gibt keine Compliance-Garantie.

## Stand und Planung

Stand 16.09.2026: Produkteditor, Dokumentverwaltung, öffentliche Passansicht, Vorschau und dauerhafte QR-IDs sind implementiert. Dieser Integrationsstand umfasst N1/N2, den geprüften Sicherheitsblock, B4 (Veröffentlichungsregeln und Datenintegrität), B3 (fortsetzbare Datei-/Produktlöschung) und B5/N7 (geprüfte Uploads, Produktbild und optionale interne Artikelnummer). Kevin hat die Übernahme und den Push nach main am 16.09. beauftragt. Das lokale Gate „MVP funktional vollständig“ bleibt offen. Cloud-Datenbankmigrationen und die Freigabe des öffentlichen Betriebs bleiben separate Schritte; ein Git-Push ersetzt sie nicht.

- [Analysebericht: Architektur, Gate, Befunde und Empfehlungen](docs/ANALYSE-2026-09-10.md)
- [Arbeitsplan: nächste Sitzungen, Abnahmekriterien und spätere Erweiterungen](docs/ROADMAP.md)
- [Noch offene Punkte bis zur lokalen Gate-Freigabe, Stand 16.09.](docs/GATE-RESTPUNKTE-2026-09-16.md)
- [Produktrichtung: Entscheidungen, Learnings, Backlog, Annahmen und offene Fragen](docs/PRODUKTVISION.md)
- [Abschluss Sicherheitsblock vom 12.09.2026](docs/ABSCHLUSS-2026-09-12.md)
- [B4-Abschluss vom 14.09.2026 und nächster Einstieg](docs/ABSCHLUSS-2026-09-14-B4.md)
- [B3-Abschluss vom 15.09.2026 und nächster Einstieg](docs/ABSCHLUSS-2026-09-15-B3.md)
- [B5/N7-Abschluss vom 16.09.2026 und Übernahmevoraussetzungen](docs/ABSCHLUSS-2026-09-16-B5-N7.md)

Der Einstieg in die Umsetzung wurde am 10.09. freigegeben; der erste Sicherheitsblock ist am 12.09. lokal implementiert und geprüft. Größere Architekturvorschläge bleiben gesondert zu entscheiden. Die ursprüngliche PP-Entscheidungshistorie und der Lernplan liegen im privaten [Brain-KI-Projektordner PassPilot](https://github.com/schaufkevin4-commits/Brain-KI/tree/main/PassPilot) und im [LP-002-Plan](https://github.com/schaufkevin4-commits/Brain-KI/blob/main/KI_Lernen/LERNPL%C3%84NE/LP-002/PLAN.md). Der Analysebericht nennt die konkret gelesenen Versionsstände. „PassPilot“ bleibt der interne Codename.

N9/F07 ist danach lokal umgesetzt und geprüft: 75 Unit-/Regressionstests, 78 Integrationstests, Lint, Typen, Build und sichtbare Browserprüfungen. Autosave/Materialentfernung/Navigationsschutz und Veröffentlichung sind koordiniert; `editor_version` schützt gegen veraltete Tabs. Die neue Migration gilt nur in `lotsora-integration` (jetzt 20 Migrationen). Details und Grenzen: [N9-Abschluss](docs/ABSCHLUSS-2026-09-16-N9.md). Kevin hat anschließend auch die Übernahme und den Push von N9 nach main beauftragt; danach Pause. Siehe [Tagesabschluss](docs/TAGESABSCHLUSS-2026-09-16.md).

N3 ist am 18.09.2026 lokal umgesetzt und geprüft: gemeinsame öffentliche Passladung, beim Öffnen erneuerte Dateilinks und kontrollierte Fehler. 93 Unit-Tests, 85 Integrationstests und sieben separate Produktions-HTTP-Tests bestanden; 21 Migrationen ausschließlich in `lotsora-integration`. Änderungen noch nicht committed/gepusht. Vertrag und Grenzen: [N3-Abschluss](docs/ABSCHLUSS-2026-09-18-N3.md). Gesamt-Gate und getrennte Veröffentlichungsstände bleiben offen.

N8/QR/proxy ist am 18.09. lokal umgesetzt: mobile Formulare, Tastaturfokus, Kontrast, QR-Rand und Proxy-Konvention. 113 Unit-/acht Produktions-HTTP-Tests bestanden; manuelle Restabnahme (Screenreader, nativer Zoom, echte Exportdateien/Druckscan) offen. [Abschluss und Grenzen](docs/ABSCHLUSS-2026-09-18-N8.md). Gesamt-Gate bleibt offen.

## Lokal entwickeln

Voraussetzungen: Node 24 gemäß .nvmrc, npm und für die lokale Supabase-Umgebung Docker. Die Entwicklung erfolgt gemäß PP-022 lokal, getrennt vom Cloud-Projekt.

1. Abhängigkeiten mit `npm ci` installieren.
2. Lokales Supabase mit `npx supabase start` starten.
3. `.env.example` als Vorlage für `.env.local` verwenden und die lokale Supabase-URL/den passenden öffentlichen Schlüssel sowie die lokale Site-URL eintragen. Für die serverseitige Uploadprüfung außerdem `SUPABASE_SERVICE_ROLE_KEY` derselben lokalen Instanz setzen; niemals mit `NEXT_PUBLIC_` veröffentlichen oder committen. PASS_BASE_URL bleibt die kanonische QR-Domain gemäß PP-016.
4. `npm run dev` starten und [localhost:3000](http://localhost:3000) öffnen. Die Startseite ist ein Platzhalter; der interne Einstieg erfolgt über `/login` bzw. `/registrieren`.

Registrierungen benötigen nun eine E-Mail-Bestätigung. Die lokalen Bestätigungs-/Resetmails verwenden `supabase/templates`; Code, Callback-URLs und Templates gehören zusammen. Die App übergibt `/auth/confirm?next=...` als Redirect-Ziel. Konfigurationsänderungen werden erst durch einen regulären Supabase-Neustart aktiv; ein Datenbank-Reset ist dafür nicht nötig. Der isolierte Teststarter kopiert dieselben Templates. Details und Cloud-Abgrenzung stehen im [Systemcheck](docs/SYSTEMCHECK-2026-09-20.md).

Schemaänderungen werden als neue Migration in supabase/migrations geführt, lokal geprüft und die Typen anschließend neu erzeugt (PP-021/022). Ein Datenbank-Reset verwirft lokale Daten; dafür eine isolierte Testinstanz verwenden. Cloud-Rollout und DNS-/Deploymentänderungen gehören zum gesonderten Livegang-Paket.

## Prüfungen

```text
npm test
npm run lint
npx next typegen
npx tsc --noEmit
npm run build
```

Am 15.09.2026 auf dem B5-Branch: 64 Unit-/Regressionstests sowie 70 Integrationstests gegen echtes lokales Supabase bestanden. Lint und Typprüfung bestanden. Nach der Korrektur der Upload-Abbruchanzeige am 16.09. bestanden Lint, Produktionsbuild einschließlich Typprüfung und der gezielte Browser-Abbruchtest erneut. Next.js ist auf 16.3.5 aktualisiert; `npm audit` meldete am 15.09. null bekannte Schwachstellen. Der Build benötigt Zugriff auf Google Fonts; die bekannte middleware-Deprecation bleibt im geplanten Nachlauf. Vollständige Browser-/Restoretests und die Gate-Abnahme stehen noch aus.

Die isolierte Testinstanz verwendet `lotsora-integration`, API-Port 55321 und DB-Port 55322. Das normale Entwicklungsprojekt `lotsora` bleibt getrennt. Voraussetzung ist ein laufendes Docker Desktop; eine Installation im Benutzerprofil wird vom Testskript gefunden.

```text
npm run test:integration:start
npm run test:integration:migrate
npm run test:integration
node scripts/integration.mjs http
npm run test:integration:stop
```

Migrationen werden aus `supabase/migrations` kopiert. `migrate` wendet sie ausschließlich auf die Testinstanz an. Tests erzeugen synthetische A/B-Konten und Dateien und räumen sie wieder auf; öffentliche Prüfungen laufen mit anon, Herstellerprüfungen mit den jeweiligen Sessions. Der Teststarter liest keine `.env.local` und übergibt lokale Testschlüssel nur an den Testprozess. `stop` erhält die Testvolumes. Die generierte Umgebung unter `.local-tests` wird nicht versioniert. B4 ergänzt deterministische Parallel-/Rollbacktests über psql im festen Testcontainer. Die fachlichen SQL-Sessions laufen als authenticated mit synthetischer Nutzer-ID. Details und Aussagegrenzen stehen im B4-Abschlussprotokoll.

B3 reserviert Dateipfade vor dem Upload und erhält offene Löschvorgänge nach der Dokument-/Produktlöschung. Eigentümer können sie unter „Offene Dateivorgänge“ fortsetzen. Unbestätigte Uploads werden nach 15 Minuten beim erneuten Laden zur bewussten Bereinigung angeboten.

B5 erlaubt PDF, JPEG, PNG und WebP bis 10 MiB, für Produktbilder nur die drei Bildformate. Dateien gehen authentifiziert direkt an Storage; der Server prüft den tatsächlichen Inhalt vor der Dokument-/Bildbindung. `products.image_url` enthält einen verwalteten Storage-Pfad; seit N3 prüft der öffentliche Dateieinstieg beim Öffnen die Freigabe und erzeugt dann einen kurzlebigen Link. App, Serverkonfiguration und alle Migrationen müssen zusammenpassen. Vorhandene Dateien werden nicht rückwirkend inhaltlich geprüft; die Übernahmevoraussetzungen stehen im B5-Abschluss. N9/F07 und N3 sind lokal abgeschlossen. Nächster Baublock nach neuem Auftrag: N8/QR/proxy; getrennte Veröffentlichungsstände bleiben offen.

## Projektstruktur

- `app/` – Seiten, Auth-Route und Server Actions (Next.js App Router)
- `components/ui/` – Bausteine (shadcn/ui)
- `components/produkte/` – Status- und Passanzeige
- `lib/services/` – Geschäftslogik und Datenzugriff, getrennt von UI/Transport (PP-021)
- `lib/supabase/` – Cookie-/Sessionanbindung sowie separater öffentlicher Client ohne Nutzersession
- `lib/types/` – generierte Datenbanktypen
- `supabase/migrations/` – Schema, Constraints, RPCs und RLS
- `docs/` – Analyse und ergänzende Planung
- `lib/qr.ts`, `lib/public-id.ts` – QR-Ausgabe und öffentliche ID-Prüfung

Vor Codeänderungen [AGENTS.md](AGENTS.md) und die relevanten Guides der installierten Next.js-Version unter node_modules/next/dist/docs lesen.
