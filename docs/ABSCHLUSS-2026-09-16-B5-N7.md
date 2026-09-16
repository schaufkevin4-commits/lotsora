# B5/N7: Uploadvertrag, Produktbild und interne Artikelnummer

Stand: 16.09.2026. Lokaler Branch `codex/b5-uploads-produktbild`, auf B3-Commit `18fcf89`; B4 ist enthalten. Push bleibt gemäß Auftrag bis zum gemeinsamen Ende zurückgestellt. Main und Cloud wurden nicht geändert.

## Ergebnis

- Dokumente erlauben PDF, JPEG, PNG und WebP bis einschließlich 10 MiB; Produktbilder JPEG, PNG und WebP. Leere Dateien, unerlaubte Endungen/MIME-Typen und zu große Dateien werden abgewiesen. Der private Bucket erzwingt ebenfalls Größe und MIME-Liste.
- Der Browser reserviert einen eigenen Dateipfad und überträgt den Dateiinhalt authentifiziert direkt an Storage. Die Server Action erhält nur Kennungen und Metadaten; ihr Body-Limit ist 1 MiB. Während der Übertragung ist ein Abbruch möglich. Fehlgeschlagene Vorgänge nutzen die dauerhafte B3-Bereinigung.
- Vor der Bindung friert die Datenbank den Upload ein. Der Server lädt ihn mit der echten Nutzersession und prüft die tatsächlichen Bytes: Bilder werden vollständig dekodiert, auf das deklarierte Format, höchstens 25 Millionen Pixel und ein Einzelbild begrenzt; PDFs benötigen Header, Abschlussmarker, lesbare Struktur und mindestens eine Seite und dürfen nicht verschlüsselt sein. PDF-Dateien werden nicht neu geschrieben. Das ist eine technische Inhaltsprüfung, kein Malware-Scan oder fachlicher Nachweis.
- Nur der separate serverseitige Verifier darf eine erfolgreiche Inhaltsprüfung bestätigen. Eigentümer, fremde Hersteller und anonyme Nutzer können die Bestätigung nicht über die öffentliche API fälschen. Nicht geprüfte Dateien lassen sich weder als Dokument noch als Produktbild anhängen. Einfrieren und fehlende Storage-UPDATE-Rechte verhindern Austausch nach der Prüfung.
- Der Dokumentabschluss ist unter Produktsperre atomar und idempotent. Parallele Abschlüsse erzeugen ein Dokument; eine verlorene Antwort wird anhand des vorhandenen Bezugs aufgelöst.
- Produktbilder können hochgeladen, ersetzt und entfernt werden. Der erwartete alte Pfad schützt gegen veraltete Änderungen. Erst nach erfolgreicher Bindung wird das alte Bild zur Bereinigung vorgemerkt. Der öffentliche Pass darf ausschließlich das aktuelle Bild eines veröffentlichten Produkts lesen, unabhängig von einer eventuell angemeldeten Herstellersession.
- Die optionale Artikelnummer bleibt Text, maximal 120 Zeichen, und erhält führende Nullen. Sie ist intern und fehlt im öffentlichen Passvertrag. Ihre Speicherung liegt mit Produkt, Textildetails und Materialien in derselben Transaktion; ein abschließender Fehler rollt alle Änderungen zurück.
- Next.js und eslint-config-next wurden auf 16.3.5 aktualisiert, kompatible transitive Sicherheitsupdates übernommen und sharp/pdf-lib für die Inhaltsprüfung ergänzt.

## Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Unit-/Regressionstests, 15.09. | 64 bestanden, davon 11 neue Inhalts-/Vertragstests |
| Integrationstests, 15.09. | 70 bestanden, davon 11 neue B5/N7-Tests; echtes isoliertes Supabase |
| Lint und Typprüfung, 15.09. | bestanden |
| npm audit, 15.09. | null bekannte Schwachstellen |
| Produktionsbuild und Lint, 16.09. | nach Abbruchanzeige-Korrektur erneut bestanden; Next.js 16.3.5, Typprüfung und 14 statische Seiten |
| Browser, 16.09. | echtes 10-MiB-PDF, gefälschtes PDF mit Bereinigung, Bild-Upload/-Tausch/-Entfernung, öffentlicher Bildaufruf, interne Artikelnummer mit führenden Nullen und verzögerter Abbruch geprüft |

Die Integrationstests prüfen außerdem unbestätigte direkte Bindung, unerlaubte Prüfbestätigung, MIME-/Größenlimit des Buckets, Überschreiben und erneutes Hochladen eingefrorener Pfade, fremde/ anonyme Zugriffe, parallelen Abschluss, veralteten Bildtausch, Rücknahme der Veröffentlichung, Produktlöschung, abgebrochene Bildoperation und vollständigen Formular-Rollback.

Browserprüfung auf dem Produktionsbuild unter `127.0.0.1:3107` gegen die isolierte API `127.0.0.1:55321`. Ein kontrolliert gehaltener Produkt-Datensatz verzögerte die Reservierung. Dabei wurde festgestellt, dass normaler Transition-State den Abbruchknopf zu spät einblendete. Die Anzeige verwendet jetzt optimistischen State; der wiederholte Test zeigte den bedienbaren Knopf während der Aktion und anschließend die Abbruchmeldung ohne zusätzliches Dokument. Der Test belegt diesen verzögerten Ablauf; ein realer Verbindungsabbruch unter Hostingbedingungen bleibt Teil der Live-Abnahme. Bildtausch und Bildentfernung wurden zusätzlich in der Datenbank als bereinigt bestätigt; keine Browserfehler gemeldet.

Die vollständigen Unit-/Integrationssuiten liefen vor dieser ausschließlich clientseitigen Anzeigekorrektur; anschließend wurden der betroffene Browserfall, Lint und der Produktionsbuild einschließlich Typprüfung erneut geprüft. Die bestehende Middleware-Deprecation bleibt im Nachlauf. Der Build benötigt Google-Font-Zugriff. Diese Prüfungen ersetzen nicht die vollständige mobile/Gate-/Restore-Abnahme.

Nach der Browserprüfung wurden das synthetische Konto und seine Dateien bereinigt. Die abschließende Datenbankabfrage zeigte jeweils null Konten, Hersteller, Produkte, Dokumente, Storage-Objekte und Dateivorgänge. Testserver und isolierte Supabase-Instanz wurden gestoppt; die Testvolumes und reservierten öffentlichen IDs bleiben erhalten.

## Migration und Konfiguration

Nur auf `lotsora-integration` angewendet: API 55321, DB 55322, insgesamt 19 Migrationen. Die drei neuen Migrationen sind in dieser Reihenfolge erforderlich:

1. `20260915210000_uploadvertrag_produktbild.sql`: Uploadzweck, Prüfvertrag, Bildbindung, Bucketlimits und atomare Artikelnummer.
2. `20260915213000_uploadabschluss_atomisch.sql`: idempotenter Dokumentabschluss unter Sperren.
3. `20260915214000_produktbild_leserechte.sql`: öffentlicher Bildzugriff über eine eindeutig aufgelöste Pfadprüfung.

App, Migrationen und Serverkonfiguration müssen gemeinsam übernommen werden. `SUPABASE_SERVICE_ROLE_KEY` muss zur konfigurierten Supabase-Instanz gehören und ausschließlich im Serverprozess liegen. Das `server-only`-Modul verwendet ihn allein zur Bestätigung einer zuvor mit der Nutzersession geprüften Datei. Dateiinhalt und Eigentumszugriff werden weiterhin über die echte Nutzersession geprüft. Der Browser erhält ausschließlich den öffentlichen Schlüssel und seine eigene Session.

`products.image_url` enthält nun einen verwalteten Storage-Pfad statt einer beliebigen URL. Bestehende nicht leere Bildwerte stoppen die Migration und benötigen eine bewusste Bestandsübernahme. Artikelnummern über 120 Zeichen müssen ebenfalls vorab behandelt werden. Vorhandene angehängte Dokumente werden als Bestand übernommen und mit `validated = true` markiert, **ohne rückwirkende Inhaltsprüfung**. Dieses Kennzeichen ist für Altdateien kein Prüfnachweis; vor Übernahme in Entwicklung/Cloud ist eine getrennte Bestandsprüfung erforderlich. Die Migration löscht oder repariert solche Bestände nicht stillschweigend.

Neue öffentliche Bildlinks sind standardmäßig eine Stunde gültig. Ein bereits ausgegebener signierter Link besitzt seine eigene Gültigkeit; es wird kein sofortiger Widerruf aller Links durch einen Statuswechsel versprochen. Cache-/Linkerneuerung und konkrete Fristen gehören zu N3.

## Transportentscheidung und Grenzen

Die 10-MiB-Grenze bleibt erhalten. Dateiinhalt läuft direkt zu Storage, weil die [Vercel-Function-Grenzen](https://vercel.com/docs/functions/limitations) diesen Umfang nicht als normalen Function-Request tragen. Die gewählte Übertragung ist ein einzelner POST mit Abbruchsignal; sie besitzt keine fortsetzbaren Chunks. Supabase empfiehlt für Dateien über 6 MB [resumierbare Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads). Ein Wiederholungsversuch startet hier eine neue reservierte Operation; die B3-Bereinigung behandelt den alten Vorgang. Diese Entscheidung ist lokal mit 10 MiB geprüft; reale Hosting-, Laufzeit- und Netzbedingungen müssen vor Livegang gesondert getestet werden.

Die Inhaltsprüfung verwendet die installierten APIs von [sharp](https://sharp.pixelplumbing.com/api-constructor/) und [pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfdocument). Dateiinhalt ist weiterhin nicht vertrauenswürdig; die Prüfung bestätigt keine inhaltliche Richtigkeit, Compliance oder Schadsoftwarefreiheit.

## Nächster Einstieg

Auf `codex/b5-uploads-produktbild` fortsetzen. Nächster Baublock ist **N9/F07 und UX-Abgleich**: Autosave am bestätigten Stand ausrichten, Materialentfernung und Navigation sichern, Veröffentlichung mit laufenden und ungespeicherten Änderungen koordinieren sowie den Editorablauf gegen PP-018/019 prüfen. Danach folgen N3, N8/QR/proxy, die begrenzten Architekturgrundlagen und der lokale Systemcheck. Das Gesamt-Gate bleibt offen; kein Push, Merge oder Cloud-Rollout wurde ausgeführt.
