// lib/services/products.ts
// Fachlogik rund um Produkte (Service-Schicht, PP-021 E2).
// UI und API-Routen rufen NUR diese Funktionen auf — keine Regeln direkt im UI.

export type ProductStatus = "entwurf" | "unvollstaendig" | "veroeffentlicht";

// --- PP-012: Materialanteile -------------------------------------------------

export type MaterialInput = {
  materialName: string;
  percentage: number; // 0..100
};

export type MaterialCheck = {
  sum: number;
  isOverLimit: boolean; // > 100  -> harte Prüfung: verhindern
  isUnderLimit: boolean; // < 100 -> weicher Hinweis
  message: string | null;
};

export function checkMaterialShares(materials: MaterialInput[]): MaterialCheck {
  const raw = materials.reduce((acc, m) => acc + (m.percentage ?? 0), 0);
  const sum = Math.round(raw * 100) / 100; // Rundungsfehler vermeiden
  if (sum > 100) {
    return {
      sum,
      isOverLimit: true,
      isUnderLimit: false,
      message: `Die Materialanteile ergeben ${sum}% – mehr als 100% ist nicht möglich.`,
    };
  }
  if (sum < 100) {
    return {
      sum,
      isOverLimit: false,
      isUnderLimit: true,
      message: `Hinweis: Die Materialanteile ergeben ${sum}% (unter 100%).`,
    };
  }
  return { sum, isOverLimit: false, isUnderLimit: false, message: null };
}

// --- PP-010/PP-011: Pflichtfelder & Veröffentlichung -------------------------

export type ProductDraft = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
};

// Pflichtfelder im MVP (PP-010): Name, Beschreibung, Kategorie.
export function getMissingRequiredFields(product: ProductDraft): string[] {
  const missing: string[] = [];
  if (!product.name?.trim()) missing.push("Produktname");
  if (!product.description?.trim()) missing.push("Produktbeschreibung");
  if (!product.category?.trim()) missing.push("Produktkategorie");
  return missing;
}

// Veröffentlichen nur, wenn alle Pflichtfelder da sind UND die Materialsumme
// 100% nicht überschreitet (PP-011 + PP-012).
export function canPublish(
  product: ProductDraft,
  materials: MaterialInput[],
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const missing = getMissingRequiredFields(product);
  if (missing.length > 0) {
    reasons.push(`Es fehlen Pflichtfelder: ${missing.join(", ")}.`);
  }
  if (checkMaterialShares(materials).isOverLimit) {
    reasons.push("Die Materialanteile ergeben mehr als 100%.");
  }
  return { ok: reasons.length === 0, reasons };
}