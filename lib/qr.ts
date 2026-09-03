import QRCode from "qrcode";

// Kanonische öffentliche Basis-URL (PP-016). Gedruckte QR-Codes zeigen IMMER
// auf diese Domain, nie auf localhost — deshalb ein fester Default.
const PASS_BASE_URL = process.env.PASS_BASE_URL ?? "https://lotsora.de";

export type FehlerKorrektur = "L" | "M" | "Q" | "H";

/** Baut die dauerhafte öffentliche Pass-URL aus der unveränderlichen Pass-ID. */
export function buildPassUrl(publicId: string): string {
  return `${PASS_BASE_URL}/p/${publicId}`;
}

/** Erzeugt den QR-Code als SVG-String (vektorbasiert, druckperfekt). */
export async function generateQrSvg(
  text: string,
  level: FehlerKorrektur = "M", // M = Standard; Q/H erst, wenn Etikettengröße feststeht
): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: level,
    margin: 1,
    width: 256,
  });
}
