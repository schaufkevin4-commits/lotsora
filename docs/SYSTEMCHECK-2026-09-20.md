# Gesamtsystemcheck – 20.09.2026

**Nachtrag manuelle Restabnahme:** Neue echte PNG-/SVG-Exports erfolgreich unabhängig dekodiert; Kevin bestätigte die gebündelte Zoom-/Sprachausgabe-Stichprobe und Handyscan vom Bildschirm auch bei 200 %. [Nachweise und genaue Aussagegrenzen](N8-RESTABNAHME-2026-09-20.md). Physischer Ausdruckscan mit festgelegter Etikettengröße bleibt mangels Drucker spätestens vor Kundeneinsatz offen. Die ausdrückliche lokale Gate-Entscheidung steht noch aus. Die folgenden offenen Einzelstatus beschreiben den ursprünglichen Abschluss vor dieser Rückmeldung.

## Ergebnis und geprüfter Stand

Die automatisierten technischen Prüfungen und der unten protokollierte Live-Produktablauf sind bestanden. Zwei Fehler im echten lokalen Auth-Mailablauf wurden gefunden und behoben. **Das lokale Gesamt-Gate bleibt wegen der ausdrücklich offenen manuellen Nachweise und Kevins Freigabe offen.**

Geprüft wurde der uncommittete Arbeitsstand auf `codex/n9-autosave-veroeffentlichung`, Basis `f652e0cae32159c9a75acdf310e99c283ca843a1`, einschließlich des Team-Baublocks. Ausschließlich `lotsora-integration`: 22 angewendete Migrationen, API 55321, DB 55322, Mailpit 55324. Produktions-HTTP-Prüfung auf 3108, sichtbare Browserprüfung auf 3109. Kein Cloud-Rollout, kein Push und keine Änderung der normalen Entwicklungsdatenbank.

## Behobene Befunde

1. **Auth-Mailvertrag:** Die lokalen Standardmails führten über Supabase `/verify` zu einem PKCE-`code`, während `/auth/confirm` einen `token_hash` erwartet. Der Fehler wurde mit einer tatsächlich erzeugten Resetmail reproduziert. Bestätigungs- und Recovery-Templates liefern jetzt den passenden Token-Hash; E-Mail-Bestätigung ist in der lokalen Konfiguration und der isolierten Testkonfiguration aktiviert. Der Teststarter kopiert die versionierten Templates.
2. **Session nach Bestätigung:** Next normalisierte die lokale IP in `request.url` zu `localhost`. Ein absoluter Redirect wechselte dadurch den Cookie-Host; die erfolgreiche Bestätigung wirkte auf der Zielseite wie eine fehlgeschlagene Anmeldung. Relative, intern geprüfte Redirects erhalten nun den tatsächlichen Host. Die Route akzeptiert nur die vorgesehenen Bestätigungstypen, setzt `no-store`/`no-referrer` und verhindert eine relative Location mit fremder Authority.

Ungültige, abgelaufene oder bereits verbrauchte Links zeigen jetzt außerdem eine verständliche Meldung auf der Anmeldeseite.

**Konfigurationsvertrag für spätere Übernahme:** Die App übergibt `RedirectTo` als `/auth/confirm?next=...`; die beiden Templates hängen `token_hash` und `type` mit `&` an diese bereits vorhandene Query an. Templates und zulässige Callback-URLs müssen gemeinsam mit dem Code übernommen werden. Cloud-Templates, echter Mailversand und Hosting bleiben im gesonderten N4-Rollout zu prüfen. Die lokale Konfigurationsdatei allein konfiguriert kein Cloudprojekt. Grundlagen: [Supabase lokale E-Mail-Templates](https://supabase.com/docs/guides/local-development/customizing-email-templates), [Templatevariablen](https://supabase.com/docs/guides/auth/auth-email-templates).

## Automatisierte Nachweise

| Prüfung | Ergebnis |
|---|---|
| `npm test` | 113 Unit-/Regressionstests bestanden |
| `npm run lint` | bestanden |
| `node node_modules/typescript/bin/tsc --noEmit` | bestanden |
| `node scripts/integration.mjs test` | 96 DB-/Service-Integrationstests bestanden; 12 separat gestartete HTTP-/Browserfälle hier erwartungsgemäß übersprungen |
| `node scripts/integration.mjs http` | Produktionsbuild und 11 Produktions-HTTP-Tests bestanden |
| `node scripts/integration.mjs browser --gate` | sichtbarer Ablauf unten; Helferstatus und Bereinigung siehe Abschluss |

Die drei neuen N1-Tests belegen serverseitige ID-Erzeugung trotz Clientvorgabe, Unveränderlichkeit einschließlich NULL-Versuch, erhaltene Reservierung nach Löschen, verhindertes Wiederverwenden und eine echte Generatorkollision. Die Generator-Fehlerinjektion läuft ausschließlich in einer zurückgerollten Transaktion.

Die drei zusätzlichen HTTP-Fälle verwenden echte lokale Auth-Mails: Registrierung mit vorab gesperrter Anmeldung, Bestätigung samt Sessioncookies, einmalige Tokenverwendung, Passwortreset mit altem/neuem Passwort, eingeladenes Konto ohne eigene Firma und korrekter Beitritt sowie abgelaufene Links, unzulässiger Typ und abgewehrtes externes Weiterleitungsziel. Passwortänderung und erneute Anmeldung wurden über den SDK-Test geprüft; dies ist kein behaupteter manueller Passwortformular-Test.

Die bestehende Suite deckt weiterhin A1/A2/B/anon, fremde Firmen, Rollenentzug, letzten Verantwortlichen, Kontolöschung, öffentliche Feldgrenzen, konkurrierende Saves/Veröffentlichung, Rollback, Uploadvalidierung und fortsetzbare Datei-/Produktlöschung ab. Damit bleiben F01–F08 im beschriebenen V1-Umfang technisch abgedeckt; die Grenzen unten gelten weiterhin.

## Sichtbar im Browser durchgeführter Ablauf

Synthetisches Produkt `92c9e294-e71f-4bfc-818a-8e62b34528f2`, Pass-ID `wYmTZgEHqCxX`:

1. Ein neu registrierter Mitarbeiter bestätigte seine E-Mail über den echten lokalen Mail-Link. Die Session blieb auf `127.0.0.1` erhalten; die Einladung konnte im Browser angenommen werden. Teamübersicht mit zwei Mitgliedern sichtbar.
2. Mitarbeiter legte „Systemcheck – Team-Shirt“ an, erfasste Pflichtangaben, interne Artikelnummer, 100 % Baumwolle, Herkunft, Pflege-/Wasch- und Reparaturhinweise. „Gespeichert“ und vollständige Angaben bestätigt.
3. Synthetisches PNG und PDF über die tatsächlichen Dateiauswahldialoge hochgeladen. Bild wurde angezeigt, Dokument zunächst als intern gekennzeichnet.
4. Produkt veröffentlicht. Lokaler öffentlicher Pass zeigte Bild und Textildaten, jedoch weder interne Artikelnummer noch internes PDF. Nach expliziter Dokumentfreigabe erschien das Datenblatt mit öffentlichem Dateieinstieg.
5. QR-Menü bedient: PNG und SVG lösten jeweils die sichtbare Download-Startmeldung aus. Der angezeigte kanonische Link lautete `https://lotsora.de/p/wYmTZgEHqCxX`. Die lokale Darstellung wurde unter `/p/wYmTZgEHqCxX` geprüft; die echte Domain wurde für diese synthetische ID nicht aufgerufen.
6. Zum Firmenverantwortlichen gewechselt. Dasselbe Produkt geöffnet und in „Systemcheck – gemeinsam aktualisiert“ umbenannt. Autosave bestätigte den Stand; der frisch geladene öffentliche Pass zeigte den neuen Namen.
7. Veröffentlichung aufgehoben: alter Passlink zeigte „Produktpass nicht verfügbar“. Wiederveröffentlichung stellte denselben Inhalt unter derselben ID wieder bereit.
8. Das selbst angelegte Testprodukt im Editor gelöscht. Produktliste enthielt wieder nur die beiden Ausgangsfixtures; alter Passlink war nicht verfügbar. Unabhängige lesende DB-Prüfung: Produktzeilen 0, Dokumentzeilen 0, Storageobjekte unter dem Produktpfad 0; beide Dateivorgänge im Zustand `deleted`.

## Offen bis zur vollständigen Abnahme

- **Neue QR-Exportdateien dieses Ablaufs:** Im integrierten Browser waren die Startmeldungen sichtbar, aber keine gespeicherten Dateien für eine unabhängige Dekodierung verfügbar. Dies ist kein Dateinachweis. Der echte PNG-/SVG-Dateinachweis vom 19.09. bleibt bestehen; eine neue Exportpaar-Prüfung für den Gesamtcheck bleibt offen. Reproduzierbarer Prüfer: `scripts/verify-qr-downloads.mjs`.
- **Echte Screenreader-Stichprobe:** von Kevin ausdrücklich vertagt; weiterhin offen.
- **Nativer 200-%-Browserzoom auf der öffentlichen `/p/`-Seite:** separat noch offen. Die Bestätigung vom 19.09. betraf Editor/interne Vorschau.
- **Physischer QR-Druck-/Handyscan und Etikettengröße:** offen, spätestens vor Kundeneinsatz.
- **Kevins ausdrückliche lokale Gate-Freigabe:** ausstehend. Offene Nachweise entweder durchführen oder als bewusste Ausnahme mit Umfang und Zeitpunkt entscheiden; keine stillschweigende Freigabe.

## Bekannte Grenzen und nächster Schritt

Gespeicherte Änderungen veröffentlichter Produkte können unmittelbar öffentlich erscheinen; getrennte Veröffentlichungsrevisionen sind noch nicht implementiert. Bereits ausgegebene signierte Dateilinks behalten ihre begrenzte Restgültigkeit. Geöffnete Seiten aktualisieren sich nicht automatisch, und laufende Lesungen bilden keinen atomaren Gesamtsnapshot. Diese Grenzen sind keine neuen Fehler dieses Testlaufs.

Nächster sinnvoller Schritt ist die gebündelte manuelle Restabnahme mit einer aktuellen temporären Testsession und danach die Gate-Entscheidung. Anschließend folgen die bestehenden Lerntage 28–30. Cloud/Hosting, Backup mit Wiederherstellungsprobe, Monitoring, Betreiberangaben und Domain/HTTPS gehören weiterhin zum gesonderten Livegang-Paket.

## Abschluss und Bereinigung

Der Browserhelfer wurde regulär beendet (`1 passed`, Exitcode 0). Eine anschließende lesende Kontrolle bestätigte: beide Browserkonten entfernt, die drei aufgeführten Produkte entfernt, keine Storageobjekte unter deren Produktpfaden. 22 angewendete Migrationen erneut bestätigt. Danach wurde `lotsora-integration` erfolgreich gestoppt; Testvolumes bleiben erhalten. Die von Next automatisch veränderte `tsconfig.json` wurde auf ihren vorherigen Inhalt zurückgesetzt. Der Bericht bleibt als dauerhafter Nachweis; die temporären Browser-Testseiten laufen nach Abschluss nicht weiter.
