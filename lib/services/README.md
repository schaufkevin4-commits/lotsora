# services — Geschäftslogik (Service-Schicht)

Hier leben die Fachregeln von Lotsora, getrennt von UI und API.

Beispiele (kommen ab Tag 18 / Phase 4):
- Darf ein Produkt veröffentlicht werden? (Pflichtfelder, PP-011)
- Materialsumme prüfen (PP-012)
- Was ist öffentlich sichtbar, was intern? (PP-013)

Regel: Die API-Routen rufen diese Module nur auf — die Logik steht hier,
nicht in den Routen. Grundlage: PP-021 (E2). An Tag 17 nur Gerüst, noch ohne Inhalt.