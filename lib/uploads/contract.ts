export const MAX_DATEI_BYTES = 10 * 1024 * 1024;
export type FilePurpose = "document" | "image";
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const DOCUMENT_ACCEPT = `${IMAGE_ACCEPT},.pdf`;
export class DateiFehler extends Error {}
export function checkFileMetadata(name: string, type: string, size: number, purpose: FilePurpose) {
  if (!Number.isSafeInteger(size) || size <= 0) throw new DateiFehler("Bitte eine nicht leere Datei auswählen.");
  if (size > MAX_DATEI_BYTES) throw new DateiFehler("Die Datei ist zu groß (maximal 10 MiB).");
  const extension = name.split(".").at(-1)?.toLowerCase();
  const expected = ({ pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, string>)[extension ?? ""];
  if (!expected || expected !== type || (purpose === "image" && expected === "application/pdf")) {
    throw new DateiFehler(purpose === "image" ? "Bitte ein JPEG-, PNG- oder WebP-Bild auswählen." : "Erlaubt sind PDF, JPEG, PNG und WebP; Dateiendung und Dateityp müssen übereinstimmen.");
  }
  return expected;
}
