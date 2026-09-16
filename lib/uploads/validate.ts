import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { checkFileMetadata, DateiFehler, type FilePurpose } from "./contract";

// Serverseitige Inhaltsprüfung, keine Virenscan-/Unbedenklichkeitszusage.
export async function validateFile(bytes: Uint8Array, name: string, type: string, purpose: FilePurpose) {
  const mime = checkFileMetadata(name, type, bytes.byteLength, purpose);
  const buffer = Buffer.from(bytes);
  try {
    if (mime === "application/pdf") {
      if (!/^%PDF-\d\.\d/.test(buffer.subarray(0, 8).toString("ascii")) || !/%%EOF\s*$/.test(buffer.subarray(-1024).toString("ascii"))) throw new Error();
      const pdf = await PDFDocument.load(bytes, { throwOnInvalidObject: true, updateMetadata: false });
      if (pdf.isEncrypted || pdf.getPageCount() < 1) throw new Error();
    } else {
      const image = sharp(buffer, { failOn: "warning", limitInputPixels: 25_000_000 });
      const metadata = await image.metadata();
      const format = ({ "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[mime];
      if (metadata.format !== format || (metadata.pages ?? 1) !== 1) throw new Error();
      // Vollständig dekodieren, nicht nur einen plausiblen Header akzeptieren.
      await image.raw().toBuffer();
    }
  } catch {
    throw new DateiFehler("Dateiinhalt ungültig oder nicht unterstützt. Bilder dürfen höchstens 25 Megapixel haben und nicht animiert sein; PDFs müssen lesbar und unverschlüsselt sein.");
  }
}
