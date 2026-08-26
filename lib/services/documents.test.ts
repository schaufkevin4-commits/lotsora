import { describe, expect, it } from "vitest";
import {
  FREIGABE_WARNUNG,
  parseDokumentSichtbarkeit,
} from "@/lib/services/documents";

describe("parseDokumentSichtbarkeit (A-020)", () => {
  it("akzeptiert die beiden erlaubten Sichtbarkeiten", () => {
    expect(parseDokumentSichtbarkeit("intern")).toBe("intern");
    expect(parseDokumentSichtbarkeit("oeffentlich")).toBe("oeffentlich");
  });

  it("verwirft unbekannte oder fehlende Werte", () => {
    expect(parseDokumentSichtbarkeit("public")).toBeNull();
    expect(parseDokumentSichtbarkeit("")).toBeNull();
    expect(parseDokumentSichtbarkeit(null)).toBeNull();
  });
});

describe("FREIGABE_WARNUNG (PP-013 E7)", () => {
  it("nennt Personendaten und die öffentliche QR-Code-Sichtbarkeit", () => {
    expect(FREIGABE_WARNUNG).toContain("personenbezogene Daten");
    expect(FREIGABE_WARNUNG).toContain("für jeden über den QR-Code sichtbar");
  });
});
