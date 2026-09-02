import { describe, it, expect } from "vitest";
import { buildPassUrl, generateQrSvg } from "./qr";

describe("qr", () => {
  it("buildPassUrl baut die ID-basierte öffentliche Pass-URL (PP-016)", () => {
    expect(buildPassUrl("abc-123")).toBe("https://lotsora.de/p/abc-123");
  });

  it("generateQrSvg liefert einen gültigen SVG-String", async () => {
    const svg = await generateQrSvg("https://lotsora.de/p/abc-123");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
  });
});
