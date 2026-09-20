# Architekturentscheidungen und Firmenzugänge – 20.09.2026

Kevin hat die drei im Chat erläuterten Richtungen angenommen, mit folgender ausdrücklicher Änderung: „ja so übernhemen , es sollen aber auch schon mehrerer benutzer pro firma möglich sein“.

Dieser Beschluss konkretisiert die [Vorlage A1–A5](ARCHITEKTURVORLAGE-2026-09-19.md). Die dortige Verschiebung gemeinsamer Firmenzugänge auf später ist damit aufgehoben. Es wird keine neue offizielle PP-Nummer vergeben. Die bisherige Beschlusshistorie bleibt erhalten; der bestätigte Umfang wird hier nachvollziehbar ergänzt.

## Bestätigte Richtung

| Thema | Beschluss | Zeitpunkt / Umfang |
|---|---|---|
| A1 Felder und Vorlagen | Kleinen versionierten Textilkatalog mit stabilen Feldkennungen vorsehen | Vor dauerhaften Importmappings oder einer zweiten Vorlagenversion; bestehendes relationales Modell weiterverwenden |
| A2 Quellen | Importierte Quellen privat, versioniert und am übernommenen Wert nachvollziehbar halten; menschliche Übernahme | Mit dem ersten echten Import; keine automatische Veröffentlichung durch Parser oder KI |
| A3 Firmenzugänge | **Mehrere Benutzer derselben Firma gehören bereits zu V1** | Vor Abnahme des erweiterten nutzbaren V1-Umfangs umsetzen; kein Aufschub bis zu einem späteren Pilotbedarf |
| A4 Veröffentlichung | Änderungen sollen künftig erst nach bewusster Freigabe öffentlich erscheinen; Autosave sichert den Bearbeitungsstand | Umsetzung vor kontrollierten Importen; die separate Freigabe ist als Richtung entschieden |
| A5 QR-Identität | Ein Code bezeichnet ein konkretes Modell mit einheitlichen veröffentlichten Angaben | Korrektur desselben Modells behält die ID; abweichende Zusammensetzung erhält ein eigenes Produkt/eine eigene ID. Keine Stück-/Chargencodes als V1-Standard |

Die Annahme betrifft die im Chat beschriebenen Richtungen. Technische Detailvorschläge aus der Vorlage – etwa konkrete Kennungen, Aufbewahrungsfristen oder der genaue Rollen-/Einladungsvertrag – sind dadurch nicht sämtlich zu eigenständigen fachlichen Beschlüssen geworden. Die größere Implementierung wird in begrenzte Blöcke aufgeteilt.

**Fortschritt nach Folgeauftrag:** Die unten vorgeschlagene Teamfunktion wurde anschließend lokal implementiert und geprüft; Nachweise und genaue Umsetzung stehen im [Team-Abschluss](ABSCHLUSS-2026-09-20-FIRMENTEAMS.md). Die Rolle wird aus dem eindeutigen Firmenverantwortlichen abgeleitet, nicht zusätzlich in Mitgliedschaften gespeichert. Autosave kann weiterhin den öffentlichen Pass ändern; getrennte Veröffentlichungsrevisionen sind noch nicht implementiert. Die folgenden Abschnitte dokumentieren den ursprünglichen Beschluss und Bauauftrag.

## Nächster Baublock: mehrere Benutzer einer Firma

Empfohlener kleinster Umfang: Jeder Mitarbeiter meldet sich mit einem eigenen Konto an. Alle Mitglieder bearbeiten denselben Firmenbestand; Produkte, Dateien und Pass-IDs gehören zur Firma. Ein gemeinsames Passwort ist keine Mehrbenutzerfunktion. Ein Zugang zu mehreren Firmen, Firmenwechsel und ein frei konfigurierbares Rollensystem sind nicht angefordert und werden nicht automatisch mitgebaut.

### Vorgeschlagene einfache Rechte

| Funktion | Firmenverantwortlicher | Mitarbeiter |
|---|---|---|
| Firmenprodukte und Dokumente sehen/bearbeiten | Ja | Ja |
| Produkte veröffentlichen/zurücknehmen, Dateien freigeben | Ja | Ja, unter den bestehenden Regeln |
| Produkte/Dateien löschen und offene Bereinigung ausführen | Ja | Ja, innerhalb derselben Firma |
| Firmenprofil ändern | Ja | Nein |
| Mitglieder einladen/entfernen und Verantwortung übertragen | Ja | Nein |
| Fremde Firmendaten lesen oder verändern | Nein | Nein |

Dies ist die empfohlene Umsetzungsauslegung, keine von Kevin ausdrücklich einzeln bestätigte Rollenmatrix. Sie vermeidet ein neues fachliches Vier-Augen-Verfahren. Mindestens ein Verantwortlicher muss erhalten bleiben; die letzte Verantwortung darf weder durch Austritt noch durch Rollenänderung oder Kontolöschung verloren gehen. Firmenlöschung ist ein eigener bewusster Vorgang, keine Nebenwirkung einer Mitarbeiterentfernung.

### Einladungen und Anmeldung

- Ein Verantwortlicher erstellt eine Einladung für eine konkrete E-Mail-Adresse und Firma. Empfohlener Einstieg: einmaliger, befristeter, widerrufbarer Einladungslink, den der Verantwortliche selbst weitergeben kann. Ein automatischer E-Mail-Versand wird daraus nicht vorausgesetzt.
- Annahme verlangt ein angemeldetes Konto mit bestätigter passender E-Mail-Adresse. Der Server prüft Firma, berechtigenden Einlader, Gültigkeit und Empfänger erneut; die URL allein gewährt noch keinen Firmenzugriff.
- Einladungsgeheimnisse nur gehasht speichern, Annahme atomar ausführen, Wiederholung und gleichzeitige Annahme kontrollieren. Keine fremden Konten suchen oder Mitgliedschaft allein anhand einer bekannten E-Mail-Adresse zuweisen.
- Die Registrierung eingeladener Mitarbeiter muss den bestehenden automatischen Firmenanlage-Trigger berücksichtigen. Einladungsdaten aus frei beschreibbaren Auth-Metadaten dürfen keine Firmenrechte verleihen.
- Vorerst eine Firmenzugehörigkeit pro Nutzer vorsehen. Bestehende Zugehörigkeit zu einer anderen Firma nicht still überschreiben, keine vorhandene Firma automatisch zusammenführen oder löschen. Den Konflikt verständlich anzeigen; ein Firmenwechsel gehört in einen separaten Vorgang.

### Konkrete technische Eingriffe

1. **Mitgliedschaften und Bestandsübernahme:** `manufacturer_memberships` mit stabiler Hersteller-ID, Nutzer-ID und einfacher Rolle; bestehende Eigentümer nachvollziehbar als Verantwortliche übernehmen. Firmen-/Produkt-/Pass-IDs bleiben unverändert. Nutzerlöschung darf die Firma nicht mehr über `manufacturers.user_id ON DELETE CASCADE` entfernen. Rollen-/Mitgliedschaftsmutationen einschließlich letzter Verantwortung in der Datenbank absichern.
2. **Alle Berechtigungswege gemeinsam umstellen:** Hersteller-/Produkt-/Detail-/Dokument-RLS, `owns_product`, Storage-Policies, Save-/Publish-RPCs und Upload-/Löschfunktionen anhand aktueller Mitgliedschaft prüfen. Kein Freischalten nur im UI, kein pauschaler Service-Role-Zugriff für Mitarbeiter. Entfernte Mitglieder verlieren neue Zugriffe und Writes trotz noch bestehender Auth-Session; bereits ausgestellte Links behalten nur ihre dokumentierte Restgültigkeit.
3. **Dateivorgänge der Firma zuordnen:** `file_operations.owner_id` und `upload-completion.ts` sind heute an den ausführenden Nutzer gebunden. Firmenbezug ergänzen und Akteur separat erhalten, damit ein berechtigtes Mitglied offene Vorgänge innerhalb der Firma übernehmen kann. Firmenbezug muss auch nach Produktlöschung für Bereinigung erhalten bleiben; entfernte Mitglieder dürfen reservierte Uploads nicht nachträglich abschließen.
4. **Services und Oberfläche:** `getMeinHersteller`/`updateMeinHersteller`, Registrierung und Profil anpassen; Teamübersicht mit Einladungen, Annahme, Entzug und klaren Rollen ergänzen. Autorisierung bei jeder serverseitigen Aktion prüfen. Fremde IDs, gefälschte Rollen und direkte API-Aufrufe dürfen dieselben Grenzen nicht umgehen.

Belegstellen: `supabase/migrations/20260815163420_hersteller.sql` (eindeutiger Nutzer und Löschkaskade), `20260816112637_hersteller_auto_anlegen.sql` (Firma pro Registrierung), `20260815164025_produkt.sql` (`owns_product` und Produkt-RLS), `20260914150000_dateiloeschung_fortsetzbar.sql` (nutzergebundene Dateivorgänge), `20260915210000_uploadvertrag_produktbild.sql` und `20260915213000_uploadabschluss_atomisch.sql` (Dateirechte); `lib/services/manufacturers.ts`, `lib/services/upload-completion.ts`, `app/(auth)/actions.ts`, `app/(intern)/profil/actions.ts`.

### Umsetzung in prüfbaren Schritten

1. Additive Migration plus Bestandsübernahme und Rechtefunktionen in `lotsora-integration`; passende generierte Typen. Registrierung und Kontolöschung in denselben Übergang einbeziehen, damit kein Zwischenstand mit ungeschützten Firmendaten entsteht.
2. Einladungs-/Annahmevertrag, Services und Teamoberfläche ergänzen. Reale Einladungen werden dabei nicht an Dritte gesendet; lokale Tests verwenden synthetische Konten.
3. Gesamte A1/A2/B/anon-Matrix prüfen: zwei Mitglieder von Firma A, fremde Firma B und ausgeloggter Besucher. A1/A2 bezeichnen hier Testnutzer, nicht die Architekturentwürfe.
4. Anschließend N8-Restabnahme und den Gesamtsystemcheck auf dem geänderten Firmenmodell fortsetzen. Frühere Einbenutzertests bleiben Regressionen, ersetzen den neuen Teamnachweis aber nicht.

### Verbindliche Abnahmekriterien für den vorgeschlagenen Baublock

- Zwei getrennte Konten arbeiten am selben Firmenprodukt; N9-Konfliktschutz verhindert stilles Überschreiben paralleler Änderungen.
- Mitarbeiter können keine Rollen erhöhen, fremde Einladungen verwenden, den Firmenbezug von Daten manipulieren oder fremde Dateien lesen.
- Falsche/abgelaufene/widerrufene Einladung bleibt wirkungslos; Mehrfachannahme erzeugt keine doppelten oder widersprüchlichen Mitgliedschaften. Registrierung für eine Einladung legt keine ungewollte zweite Firma an.
- Rollenentzug und Entfernung sperren neue Datenzugriffe, Saves und Uploadabschlüsse auch in einem bereits geöffneten Browser. Kontrollierte Datei-/Produktlöschung und offene Bereinigungen funktionieren mit einem anderen berechtigten Firmenmitglied weiter.
- Letzter Verantwortlicher, Übertragung und Kontolöschung verlieren weder die Firma noch deren Produkte/Dateien. Bestehende ID-Reservierungen und öffentliche A/B/anon-Projektion bleiben erhalten.
- Alle bestehenden Save-/Publish-, Upload-/Lösch- und Zugriffsregressionen plus neue Teamfälle bestehen auf dem erweiterten Integrationsstand; manuelle Teamabläufe werden dokumentiert.

## Einordnung zum Gate

Die fachlichen Richtungsfragen A1–A5 sind mit dem obigen Umfang entschieden. **Gemeinsame Firmenzugänge sind durch Kevins ausdrückliche Ergänzung ein neuer V1-MUSS-Punkt.** Das erweitert den noch ausstehenden Gesamtcheck; eine vollständige V1-Abnahme allein auf dem bisherigen Einbenutzermodell reicht nicht mehr.

Separate Veröffentlichungsrevisionen bleiben für den vereinbarten späteren Zeitpunkt vor kontrollierten Importen vorgesehen. N8-Screenreader, separater öffentlicher Zoomnachweis und physischer QR-Test bleiben offen. Keine Datenbankmigration, App-Implementierung, externe Einladung, Commit, Push oder Livegang in diesem Dokumentationsblock.
