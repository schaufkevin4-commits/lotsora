import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import sharp from "sharp";
import jsQR from "jsqr";

// Read the actual saved browser downloads; never regenerate the expected QR.
// Usage: node scripts/verify-qr-downloads.mjs <expected-pass-url> <download.svg> <download.png>
try {
  const [expected, ...paths] = process.argv.slice(2);
  if (!expected || paths.length !== 2 ||
      !paths.some(path => extname(path).toLowerCase() === ".svg") ||
      !paths.some(path => extname(path).toLowerCase() === ".png")) {
    throw new Error("Aufruf: node scripts/verify-qr-downloads.mjs <Pass-URL> <Download.svg> <Download.png>");
  }
  const url = new URL(expected);
  if (!["http:", "https:"].includes(url.protocol) || !/^\/p\/[^/]+$/.test(url.pathname) || url.search || url.hash) {
    throw new Error("Eine vollständige Pass-URL ohne Query oder Fragment ist erforderlich.");
  }
  const results = [];
  for (const path of paths) {
    const bytes = await readFile(path);
    const metadata = await sharp(bytes).metadata();
    const format = extname(path).slice(1).toLowerCase();
    if (metadata.format !== format) throw new Error(`${path}: Dateiformat stimmt nicht mit der Endung überein.`);
    if (format === "png" && (metadata.width !== 1024 || metadata.height !== 1024)) {
      throw new Error(`${path}: Erwartet wird der unveränderte 1024×1024-PNG-Browserexport.`);
    }
    const raster = sharp(bytes);
    if (format === "svg") raster.resize(1024, 1024);
    const { data, info } = await raster.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (!decoded || decoded.data !== expected) {
      throw new Error(`${path}: QR nicht lesbar oder enthält eine andere Pass-URL.`);
    }
    results.push({
      file: resolve(path), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
      format, width: metadata.width, height: metadata.height, decodedUrl: decoded.data,
    });
  }
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), status: "passed", files: results }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Downloadprüfung fehlgeschlagen.");
  process.exitCode = 1;
}
