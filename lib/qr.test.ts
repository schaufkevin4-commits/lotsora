import { describe, it, expect } from "vitest";
import { buildPassUrl, generateQrSvg } from "./qr";

describe("qr", () => {
  it("buildPassUrl baut die öffentliche URL aus der Pass-ID (PP-016)", () => {
    expect(buildPassUrl("7Kf3mQ9xT2Wp")).toBe("https://lotsora.de/p/7Kf3mQ9xT2Wp");
  });

  it("generateQrSvg liefert einen gültigen SVG-String", async () => {
    const svg = await generateQrSvg("https://lotsora.de/p/7Kf3mQ9xT2Wp");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
  });
});
