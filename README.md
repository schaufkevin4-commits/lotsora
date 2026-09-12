# Lotsora

Textil-/Apparel-first-Anwendung für Produktdaten, Dokumente und öffentliche digitale Produktpässe. Langfristig soll daraus eine einfach bedienbare, KI-gestützte Produktdatenplattform werden. Die abschließende Prüfung und Veröffentlichung bleiben beim verantwortlichen Kunden; Lotsora gibt keine Compliance-Garantie.

## Stand und Planung

Stand 12.09.2026: Produkteditor, Dokumentverwaltung, öffentliche Passansicht, Vorschau und dauerhafte QR-IDs sind implementiert. N1/N2 und der geprüfte Sicherheitsblock sind in main integriert. Das lokale Gate „MVP funktional vollständig“ bleibt offen. Cloud-Datenbankmigrationen und die Freigabe des öffentlichen Betriebs bleiben separate Schritte; ein Git-Push ersetzt sie nicht.

- [Analysebericht: Architektur, Gate, Befunde und Empfehlungen](docs/ANALYSE-2026-09-10.md)
- [Arbeitsplan: nächste Sitzungen, Abnahmekriterien und spätere Erweiterungen](docs/ROADMAP.md)
- [Produktrichtung: Entscheidungen, Learnings, Backlog, Annahmen und offene Fragen](docs/PRODUKTVISION.md)
- [Abschluss Sicherheitsblock vom 12.09.2026 und nächster Einstieg](docs/ABSCHLUSS-2026-09-12.md)

Der Einstieg in die Umsetzung wurde am 10.09. freigegeben; der erste Sicherheitsblock ist am 12.09. lokal implementiert und geprüft. Größere Architekturvorschläge bleiben gesondert zu entscheiden. Die ursprüngliche PP-Entscheidungshistorie und der Lernplan liegen im privaten [Brain-KI-Projektordner PassPilot](https://github.com/schaufkevin4-commits/Brain-KI/tree/main/PassPilot) und im [LP-002-Plan](https://github.com/schaufkevin4-commits/Brain-KI/blob/main/KI_Lernen/LERNPL%C3%84NE/LP-002/PLAN.md). Der Analysebericht nennt die konkret gelesenen Versionsstände. „PassPilot“ bleibt der interne Codename.

## Lokal entwickeln

Voraussetzungen: Node 24 gemäß .nvmrc, npm und für die lokale Supabase-Umgebung Docker. Die Entwicklung erfolgt gemäß PP-022 lokal, getrennt vom Cloud-Projekt.

1. Abhängigkeiten mit `npm ci` installieren.
2. Lokales Supabase mit `npx supabase start` starten.
3. `.env.example` als Vorlage für `.env.local` verwenden und die lokale Supabase-URL/den passenden öffentlichen Schlüssel sowie die lokale Site-URL eintragen. Keine geheimen Schlüssel committen. PASS_BASE_URL bleibt die kanonische QR-Domain gemäß PP-016.
4. `npm run dev` starten und [localhost:3000](http://localhost:3000) öffnen. Die Startseite ist ein Platzhalter; der interne Einstieg erfolgt über `/login` bzw. `/registrieren`.

Schemaänderungen werden als neue Migration in supabase/migrations geführt, lokal geprüft und die Typen anschließend neu erzeugt (PP-021/022). Ein Datenbank-Reset verwirft lokale Daten; dafür eine isolierte Testinstanz verwenden. Cloud-Rollout und DNS-/Deploymentänderungen gehören zum gesonderten Livegang-Paket.

## Prüfungen

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Am 12.09.2026: 51 Unit-/Regressionstests sowie acht Integrationstests gegen echtes lokales Supabase bestanden. Lint, Typprüfung und Produktionsbuild bestanden. Der Build benötigt Zugriff auf Google Fonts; die bekannte middleware-Deprecation bleibt im späteren N9-Paket. Browser-/Restoretests und die vollständige Gate-Abnahme stehen noch aus.

Die isolierte Testinstanz verwendet `lotsora-integration`, API-Port 55321 und DB-Port 55322. Das normale Entwicklungsprojekt `lotsora` bleibt getrennt. Voraussetzung ist ein laufendes Docker Desktop; eine Installation im Benutzerprofil wird vom Testskript gefunden.

```text
npm run test:integration:start
npm run test:integration:migrate
npm run test:integration
npm run test:integration:stop
```

Migrationen werden aus `supabase/migrations` kopiert. `migrate` wendet sie ausschließlich auf die Testinstanz an. Tests erzeugen synthetische A/B-Konten und Dateien und räumen sie wieder auf; öffentliche Prüfungen laufen mit anon, Herstellerprüfungen mit den jeweiligen Sessions. Der Teststarter liest keine `.env.local` und übergibt lokale Testschlüssel nur an den Testprozess. `stop` erhält die Testvolumes. Die generierte Umgebung unter `.local-tests` wird nicht versioniert. Details und Aussagegrenzen stehen im Abschlussprotokoll.

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
