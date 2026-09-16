import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { checkFileMetadata, MAX_DATEI_BYTES } from "./contract";
import { validateFile } from "./validate";

describe("B5: verbindlicher Uploadinhalt", () => {
  it.each(["jpeg", "png", "webp"] as const)("dekodiert echte %s-Bilder", async format => {
    const bytes = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).toFormat(format).toBuffer();
    await expect(validateFile(bytes, `bild.${format}`, `image/${format}`, "image")).resolves.toBeUndefined();
  });
  it("prüft eine echte PDF und lehnt dieselbe Datei als Produktbild ab", async () => {
    const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save();
    await expect(validateFile(bytes, "dokument.pdf", "application/pdf", "document")).resolves.toBeUndefined();
    await expect(validateFile(bytes, "dokument.pdf", "application/pdf", "image")).rejects.toThrow();
  });
  it.each(["svg", "html", "exe", "gif"])("weist %s bereits im Vertrag ab", extension => {
    expect(() => checkFileMetadata(`datei.${extension}`, "image/png", 100, "document")).toThrow();
  });
  it("prüft Nullgröße, Obergrenze und MIME unabhängig von der Endung", () => {
    expect(() => checkFileMetadata("a.pdf", "application/pdf", 0, "document")).toThrow();
    expect(() => checkFileMetadata("a.pdf", "application/pdf", MAX_DATEI_BYTES + 1, "document")).toThrow();
    expect(() => checkFileMetadata("a.pdf", "image/png", 100, "document")).toThrow();
    expect(checkFileMetadata("a.pdf", "application/pdf", MAX_DATEI_BYTES, "document")).toBe("application/pdf");
  });
  it("verwirft gefälschte und abgeschnittene Inhalte", async () => {
    for (const [name, mime, content] of [["fake.pdf", "application/pdf", "%PDF-1.7\nhello\n%%EOF"], ["fake.png", "image/png", "<html>nicht PNG</html>"]]) {
      await expect(validateFile(Buffer.from(content), name, mime, "document")).rejects.toThrow();
    }
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "blue" } }).png().toBuffer();
    await expect(validateFile(png.subarray(0, 40), "a.png", "image/png", "image")).rejects.toThrow();
    await expect(validateFile(png, "a.jpg", "image/jpeg", "image")).rejects.toThrow();
  });
  it("begrenzt die dekodierte Bildgröße", async () => {
    const large = await sharp({ create: { width: 5001, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
    await expect(validateFile(large, "gross.png", "image/png", "image")).rejects.toThrow();
  });
});
