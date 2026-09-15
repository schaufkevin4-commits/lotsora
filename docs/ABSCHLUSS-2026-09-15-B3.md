# B3/F05: fortsetzbare Datei- und Produktlöschung

Stand: 15.09.2026. Lokaler Branch `codex/b3-dateiloeschung`, auf B4-Commit `29fe352`. B3 wurde nach der Pause vom 14.09. abgeschlossen. Push bleibt gemäß Auftrag bis zum gemeinsamen Ende zurückgestellt; main und Cloud wurden nicht geändert.

## Ergebnis

- `file_operations` speichert Eigentümer, Produkt, Dokument und exakten Dateipfad vor dem Upload. Dieser Bezug überlebt die Löschung von Dokument, Produkt und Konto. Erledigte Pfade bleiben gesperrt und können nicht erneut belegt werden.
- Dokument-/Produktlöschung und Erfassung der offenen Dateivorgänge erfolgen in derselben DB-Transaktion. Ein DB-Fehler rollt beides zurück. Nach erfolgreicher Produktlöschung ist der öffentliche Pass nicht mehr verfügbar; seine öffentliche ID bleibt reserviert.
- Dateien werden über die Storage-API entfernt. Eigentümer behalten dafür Zugriff auf genau ihre offenen Dateien, auch wenn das Produkt bereits fehlt. Fremde Hersteller und anonyme Besucher erhalten diese Rechte nicht.
- Ein Auftrag gilt erst als erledigt, wenn die DB bestätigt, dass weder Storage-Objekt noch Dokumentverweis vorhanden sind. Ein leeres Storage-Ergebnis, ein Antwortverlust oder eine begrenzte API-Ergebnisliste reicht nicht als Erfolgsbeleg. Wiederholungen sind möglich.
- Fehlgeschlagene Uploads werden gezielt bereinigt. Bei verlorener Insert-Antwort prüft der Service zuerst, ob das Dokument bereits erfolgreich angehängt wurde. Ein nicht bestätigter Upload bleibt dauerhaft auffindbar.
- Produktliste und Editor zeigen offene Dateivorgänge mit einem erneuten Bereinigungsversuch. Unbestätigte Uploads erscheinen nach 15 Minuten beim erneuten Laden. Ihre Bereinigung ist bewusst auszulösen und bricht einen gegebenenfalls noch laufenden Upload ab.
- Dokument- und Produktlöschdialoge zeigen Verarbeitung und Fehler. Produktsperren koordinieren Upload, Dokumentbindung und Löschung; verspätete Uploads oder neue Dokumentbindungen nach begonnenem Aufräumen werden abgewiesen.
- Datenbanktypen wurden aus der isolierten migrierten Datenbank erzeugt.

## Prüfungen

| Prüfung | Ergebnis am 15.09.2026 |
|---|---|
| Unit-/Regressionstests | 53 Tests in fünf Dateien bestanden |
| Integrationstests | 59 Tests in fünf Dateien bestanden: 19 B3, 32 B4, acht bestehende Zugriffstests |
| Lint | bestanden |
| Next-Routentypen und TypeScript | bestanden |
| Produktionsbuild | Next.js 16.3.0; alle 14 statischen Seiten erfolgreich |
| Gezielter Browserablauf | Anmeldung mit synthetischem Konto, offener Vorgang sichtbar/bereinigbar, Dokumentlöschung, Produktlöschung mit Rückkehr zur leeren Liste |

Die B3-Integrationstests prüfen fehlende Dateien, Storage-Ausfall, leere Remove-Antwort, verlorene Remove-/Insert-Antworten, Uploadabbruch, DB-Fehler mit vollständigem Rollback, gemeinsame Dateiverweise, direkte API-/SQL-Löschung, Wiederholung, fremde Zugriffe und unzulässige Abschlussmeldungen. Ein zusätzlich begrenzter echter API-Leseaufruf weist nach, dass verbleibende Dateien weiterhin als offen gelten.

Zwei Paralleltests halten eine fachliche SQL-Transaktion offen und beobachten die tatsächlich wartende Gegentransaktion: Upload während Produktlöschung sowie Dokument-Insert während Bereinigungsbeginn. Die Fachtransaktionen laufen als `authenticated` mit synthetischer Nutzer-ID. Privilegierte SQL-Zugriffe dienen ausschließlich Testaufbau, Fehlerauslösung und Sperrbeobachtung im festen Testcontainer.

Browserprüfung auf dem Produktionsbuild unter `127.0.0.1:3107`, ausschließlich gegen die isolierte API `127.0.0.1:55321`. Die Verarbeitungssperre war im Löschdialog sichtbar; die Dokumentzeile und der erfolgreiche Bereinigungseintrag verschwanden nach Abschluss. Diese gezielte Prüfung ersetzt keine vollständige A/B/anon- und mobile Gate-Abnahme.

Die bestehende Next-Middleware-Deprecation bleibt im geplanten Nachlauf. Der Build verwendete lokale Testkonfiguration und benötigte den Google-Font-Download.

Abschließende DB-Prüfung: null Testkonten, Produkte, Materialien, Dokumente, Storage-Objekte und Dateivorgänge; keine temporären Test-/Fehlerfunktionen. Beide Browser-Dateivorgänge waren vor der Testbereinigung bereits `deleted`. Testserver und isolierte Supabase-Instanz wurden gestoppt; Testvolumes und reservierte öffentliche IDs bleiben erhalten.

## Migration und Betrieb

Migration: `20260914150000_dateiloeschung_fortsetzbar.sql`. Sie wurde ausschließlich auf `lotsora-integration` angewendet (API 55321, DB 55322; insgesamt 16 Migrationen). Vorhandene zuordenbare Dateien und Dokumentverweise werden übernommen. Nicht zuordenbare Storage-Objekte führen zum Abbruch und erfordern eine Bestandsprüfung; die Migration errät keine Eigentümer und entfernt keine Altdateien.

App und Migration müssen gemeinsam übernommen werden: Uploads benötigen jetzt `reserve_document_upload`; der frühere direkte Storage-Upload ohne Reservierung wird durch RLS abgewiesen. B4s geänderter `save_product`-Vertrag ist ebenfalls enthalten. Vor einer Übernahme in Entwicklung oder Cloud sind deren tatsächlicher Schema- und Dateibestand gesondert zu prüfen.

Storage-Daten werden ausschließlich über die API verändert, entsprechend der [Supabase-Dokumentation zum Storage-Schema](https://supabase.com/docs/guides/storage/schema/design). Die DB liest `storage.objects` nur zur Bestands-/Abschlussprüfung und ergänzt die Zugriffspolicies.

Es gibt keinen automatischen Hintergrunddienst. Offene Dateien bleiben bis zum erfolgreichen erneuten Versuch gespeichert. Sehr große Vorgangsmengen können wegen API-Seitengrenzen mehrere Durchläufe benötigen; verbleibende Einträge verhindern die Erfolgsbestätigung. Eine Konto-/Firmenlöschung erhält den Dateibezug, benötigt für spätere Bereinigung ohne Nutzersession jedoch einen gesonderten administrativen Ablauf. Das ist kein Bestandteil der normalen Produktlöschung.

## Nächster Einstieg

Auf `codex/b3-dateiloeschung` fortsetzen. B4 und B3 liegen dort lokal; main enthält sie noch nicht. Nächster Baublock ist **B5 + N7: Uploadvertrag für PDF/Bilder, Produktbild und optionale interne Artikelnummer**. Danach folgen die übrigen Punkte der Roadmap einschließlich Autosave, Cache, Zugriff/QR und lokalem Systemcheck. Das Gesamt-Gate bleibt offen; Tag 28 folgt erst nach dokumentierter Gate-Abnahme und Freigabe.
