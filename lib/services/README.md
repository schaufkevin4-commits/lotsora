# services — Geschäftslogik und Datenzugriff

Stand: 14.09.2026. Grundlage bleibt PP-021: Fachregeln und Datenzugriff werden von UI und Transport getrennt. Die aktuelle Anwendung ruft die Services überwiegend aus Server Components und Server Actions auf.

- products.ts: Produktzugriff, Pflichtfelder/Status (PP-010/011), Materialregeln (PP-012), atomarer Formular-Save über save_product sowie öffentlicher Pass und Vorschau.
- documents.ts: private Dateiablage, Metadaten, Sichtbarkeit (PP-013/A-020), signierte Links und Löschung.
- manufacturers.ts: Herstellerprofil und Zuordnung zum angemeldeten Nutzer.

Die Services erhalten den Supabase-Client als Parameter. Datenbankrechte/RLS prüfen den Zugriff; einige Invarianten liegen bereits in SQL-RPCs. Öffentliche Seiten verwenden jetzt den separaten Client aus lib/supabase/public.ts und explizite Datenfelder. Die neue Migration bindet Dokumentdateien an ihr Produkt und schützt interne Dokumentnotizen. Details und Prüfnachweise stehen im [Abschlussprotokoll](../../docs/ABSCHLUSS-2026-09-12.md); die [Analyse](../../docs/ANALYSE-2026-09-10.md) bleibt als historischer Ausgangsstand erhalten. B4 erzwingt die Veröffentlichungs- und Materialregeln nun auch bei direkten API-Schreibwegen. `save_product` erwartet `p_expected_status`; Veröffentlichung und Rücknahme verwenden eigene atomare RPCs. Konflikte und ungültige Transaktionen werden abgewiesen. Details und Integrationsgrenzen: [B4-Abschluss](../../docs/ABSCHLUSS-2026-09-14-B4.md).

Geplante Erweiterungen gemäß [Produktrichtung](../../docs/PRODUKTVISION.md): Parser erzeugen separate Vorschläge; menschliche Übernahme und Veröffentlichung bleiben eigene Schritte. Noch kein Import-, Template- oder KI-System implementiert.
