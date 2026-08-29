import { describe, it, expect } from "vitest";
import {
  checkMaterialShares,
  validateMaterialShares,
  leiteStatusAb,
  getMissingRequiredFields,
  canPublish,
  parseSort,
  standardRichtung,
  zaehleNachStatus,
  type ProductStatus,
} from "@/lib/services/products";

describe("checkMaterialShares (PP-012)", () => {
  it("Summe = 100 % ist ok (kein Hinweis, keine Sperre)", () => {
    const r = checkMaterialShares([
      { materialName: "Baumwolle", percentage: 80 },
      { materialName: "Polyester", percentage: 20 },
    ]);
    expect(r.sum).toBe(100);
    expect(r.isOverLimit).toBe(false);
    expect(r.isUnderLimit).toBe(false);
    expect(r.message).toBeNull();
  });

  it("Summe < 100 % erzeugt nur einen weichen Hinweis", () => {
    const r = checkMaterialShares([{ materialName: "Baumwolle", percentage: 90 }]);
    expect(r.isUnderLimit).toBe(true);
    expect(r.isOverLimit).toBe(false);
    expect(r.message).toContain("90");
  });

  it("Summe > 100 % wird hart gesperrt", () => {
    const r = checkMaterialShares([
      { materialName: "Baumwolle", percentage: 80 },
      { materialName: "Polyester", percentage: 30 },
    ]);
    expect(r.sum).toBe(110);
    expect(r.isOverLimit).toBe(true);
    expect(r.message).toContain("100");
  });

  it("rundet Gleitkomma-Summen sauber (3 × 33,33 = 99,99)", () => {
    const r = checkMaterialShares([
      { materialName: "A", percentage: 33.33 },
      { materialName: "B", percentage: 33.33 },
      { materialName: "C", percentage: 33.33 },
    ]);
    expect(r.sum).toBe(99.99);
    expect(r.isUnderLimit).toBe(true);
  });

  it("leere Liste = 0 % (weicher Hinweis, keine Sperre)", () => {
    const r = checkMaterialShares([]);
    expect(r.sum).toBe(0);
    expect(r.isOverLimit).toBe(false);
    expect(r.isUnderLimit).toBe(true);
  });
});

describe("getMissingRequiredFields (PP-010)", () => {
  it("vollständige Pflichtfelder ⇒ nichts fehlt", () => {
    expect(
      getMissingRequiredFields({ name: "T-Shirt", description: "Bio", category: "Shirt" }),
    ).toEqual([]);
  });

  it("leere/whitespace Felder zählen als fehlend", () => {
    const fehlt = getMissingRequiredFields({ name: "  ", description: "", category: null });
    expect(fehlt).toContain("Produktname");
    expect(fehlt).toContain("Produktbeschreibung");
    expect(fehlt).toContain("Produktkategorie");
    expect(fehlt).toHaveLength(3);
  });
});

describe("leiteStatusAb (PP-011)", () => {
  const komplett = { name: "T", description: "D", category: "C" };
  const leer = { name: "", description: "", category: "" };

  it("vollständig + Entwurf ⇒ entwurf", () => {
    expect(leiteStatusAb(komplett, "entwurf")).toBe("entwurf");
  });
  it("unvollständig ⇒ unvollstaendig", () => {
    expect(leiteStatusAb(leer, "entwurf")).toBe("unvollstaendig");
  });
  it("veröffentlicht bleibt veröffentlicht (kein automatischer Rücksprung)", () => {
    expect(leiteStatusAb(leer, "veroeffentlicht")).toBe("veroeffentlicht");
  });
});

describe("canPublish (PP-011 + PP-012)", () => {
  it("blockt bei fehlenden Pflichtfeldern UND > 100 % Material", () => {
    const r = canPublish({ name: "", description: "", category: "" }, [
      { materialName: "A", percentage: 120 },
    ]);
    expect(r.ok).toBe(false);
    expect(r.reasons.length).toBeGreaterThanOrEqual(2);
  });
  it("erlaubt Veröffentlichen bei vollständigen Feldern und ≤ 100 %", () => {
    const r = canPublish({ name: "T", description: "D", category: "C" }, [
      { materialName: "Baumwolle", percentage: 100 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
  it("erlaubt weniger als 100 % Material als weichen Hinweis", () => {
    const r = canPublish({ name: "T", description: "D", category: "C" }, [
      { materialName: "Baumwolle", percentage: 80 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
  it("sperrt mehr als 100 % trotz vollständiger Pflichtfelder", () => {
    const r = canPublish({ name: "T", description: "D", category: "C" }, [
      { materialName: "Baumwolle", percentage: 80 },
      { materialName: "Polyester", percentage: 30 },
    ]);
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("Die Materialanteile ergeben mehr als 100%.");
  });
});

describe("validateMaterialShares (PP-012)", () => {
  it("weist negative und nicht endliche Einzelwerte ab", () => {
    expect(
      validateMaterialShares([{ materialName: "A", percentage: -1 }]),
    ).toContain("0% und 100%");
    expect(
      validateMaterialShares([{ materialName: "A", percentage: Number.NaN }]),
    ).toContain("0% und 100%");
  });

  it("weist Einzelwerte über 100 auch bei ausgeglichener Summe ab", () => {
    expect(
      validateMaterialShares([
        { materialName: "A", percentage: 110 },
        { materialName: "B", percentage: -10 },
      ]),
    ).toContain("0% und 100%");
  });

  it("wendet die bestehende Summenregel an", () => {
    expect(
      validateMaterialShares([
        { materialName: "A", percentage: 60 },
        { materialName: "B", percentage: 50 },
      ]),
    ).toContain("mehr als 100%");
  });
});

describe("parseSort / standardRichtung (PP-020 E5)", () => {
  it("gültige Werte werden übernommen", () => {
    expect(parseSort("name", "asc")).toEqual({ key: "name", dir: "asc" });
  });
  it("unbekannte Spalte ⇒ Default geaendert/desc", () => {
    expect(parseSort("quatsch", undefined)).toEqual({ key: "geaendert", dir: "desc" });
  });
  it("Startrichtung: Datum absteigend, Text aufsteigend", () => {
    expect(standardRichtung("geaendert")).toBe("desc");
    expect(standardRichtung("name")).toBe("asc");
  });
});

describe("zaehleNachStatus (Dashboard-Kacheln)", () => {
  it("zählt gesamt, veröffentlicht und Entwürfe+Unvollständig", () => {
    const rows: { status: ProductStatus }[] = [
      { status: "veroeffentlicht" },
      { status: "entwurf" },
      { status: "unvollstaendig" },
      { status: "veroeffentlicht" },
    ];
    const z = zaehleNachStatus(rows);
    expect(z.gesamt).toBe(4);
    expect(z.veroeffentlicht).toBe(2);
    expect(z.entwuerfe).toBe(2);
  });
});
