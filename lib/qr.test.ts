import { describe, it, expect } from "vitest";
import { buildPassUrl, generateQrSvg } from "./qr";
import QRCode from "qrcode";
import sharp from "sharp";
import jsQR from "jsqr";

describe("qr", () => {
  it("buildPassUrl baut die öffentliche URL aus der Pass-ID (PP-016)", () => {
    expect(buildPassUrl("7Kf3mQ9xT2Wp")).toBe("https://lotsora.de/p/7Kf3mQ9xT2Wp");
  });

  it("generateQrSvg liefert einen gültigen SVG-String", async () => {
    const svg = await generateQrSvg("https://lotsora.de/p/7Kf3mQ9xT2Wp");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
  });

  it.each(["M", "Q", "H"] as const)("erhält QR-Matrix und vier weiße Randmodule bei %s im PNG", async level => {
    const url = buildPassUrl("7Kf3mQ9xT2Wp");
    const matrix = QRCode.create(url, { errorCorrectionLevel: level }).modules;
    const svg = await generateQrSvg(url, level);
    const modules = matrix.size + 8;
    expect(svg).toContain(`viewBox="0 0 ${modules} ${modules}"`);
    const { data, info } = await sharp(Buffer.from(svg)).resize(1024, 1024).flatten({ background: "white" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let y = 0; y < modules; y++) for (let x = 0; x < modules; x++) {
      const px = Math.floor((x + 0.5) * info.width / modules);
      const py = Math.floor((y + 0.5) * info.height / modules);
      const inside = x >= 4 && y >= 4 && x < modules - 4 && y < modules - 4;
      const black = inside && matrix.get(y - 4, x - 4);
      const value = data[(py * info.width + px) * info.channels];
      expect(value, `Modul ${x}/${y}`).toBe(black ? 0 : 255);
    }
  });

  it.each([256, 1024])("dekodiert SVG-Raster/PNG bei %i Pixeln unabhängig zur Pass-URL", async size => {
    const url = buildPassUrl("7Kf3mQ9xT2Wp");
    const png = await sharp(Buffer.from(await generateQrSvg(url))).resize(size, size).png().toBuffer();
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data).toBe(url);
  });
});
