// lib/services/products.ts
// Fachlogik + Datenzugriff rund um Produkte (Service-Schicht, PP-021 E2).
// UI und API-Routen rufen NUR diese Funktionen auf — keine Regeln direkt im UI.
// Der Supabase-Client wird übergeben; RLS (PP-017) sorgt dafür, dass nur eigene
// Produktzeilen sichtbar/änderbar sind.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { getMeinHersteller } from "@/lib/services/manufacturers";

type DB = SupabaseClient<Database>;

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

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

// --- PP-010/PP-011: Pflichtfelder, Status & Veröffentlichung -----------------

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

// Leitet den Status aus den Pflichtfeldern ab (PP-011).
// Ein veröffentlichtes Produkt bleibt veröffentlicht (kein automatischer Rücksprung).
export function leiteStatusAb(
  product: ProductDraft,
  aktuellerStatus: ProductStatus,
): ProductStatus {
  if (aktuellerStatus === "veroeffentlicht") return "veroeffentlicht";
  return getMissingRequiredFields(product).length === 0 ? "entwurf" : "unvollstaendig";
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

// Zählt Produkte nach Status für die Dashboard-Kacheln (PP-011).
export function zaehleNachStatus(produkte: Pick<Product, "status">[]) {
  return {
    gesamt: produkte.length,
    veroeffentlicht: produkte.filter((p) => p.status === "veroeffentlicht").length,
    entwuerfe: produkte.filter(
      (p) => p.status === "entwurf" || p.status === "unvollstaendig",
    ).length,
  };
}

// --- Datenzugriff (RLS filtert automatisch auf den eigenen Hersteller) -------

// Alle eigenen Produkte, neueste zuerst.
export async function getMeineProdukte(supabase: DB): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Ein einzelnes Produkt lesen (RLS lässt nur eigene durch).
export async function getProdukt(supabase: DB, id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Neues, leeres Produkt anlegen — hängt am eigenen Hersteller.
// Status wird abgeleitet: leer ⇒ „Unvollständig" (PP-011).
export async function createProdukt(supabase: DB): Promise<Product> {
  const hersteller = await getMeinHersteller(supabase);
  if (!hersteller) {
    throw new Error("Kein Hersteller zum eingeloggten Konto gefunden.");
  }
  const basis = { name: "", description: "", category: "" };
  const { data, error } = await supabase
    .from("products")
    .insert({
      manufacturer_id: hersteller.id,
      ...basis,
      status: leiteStatusAb(basis, "entwurf"),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Basisfelder speichern.
export async function updateProdukt(
  supabase: DB,
  id: string,
  patch: ProductUpdate,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}