/** Fehlendes und durch RLS verborgenes Ziel erhalten dieselbe Meldung. */
export class LoeschzielFehler extends Error {
  constructor(ziel: "Produkt" | "Dokument") {
    super(`${ziel} nicht gefunden oder kein Zugriff.`);
    this.name = "LoeschzielFehler";
  }
}
