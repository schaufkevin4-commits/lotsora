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

export type VeroeffentlichenErgebnis = { ok: boolean; reasons: string[] };

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

// Sortierung der Übersicht (PP-020 E5: Übersicht/Sortierung — Spalte + Richtung).
export type ProduktSortKey = "name" | "status" | "geaendert";
export type SortRichtung = "asc" | "desc";

// Auf welche echte Spalte die Sortierung zeigt.
const SORT_SPALTE: Record<ProduktSortKey, "name" | "status" | "updated_at"> = {
  name: "name",
  status: "status",
  geaendert: "updated_at",
};

// Sinnvolle Startrichtung je Spalte (Text A→Z, Datum neueste zuerst).
export function standardRichtung(key: ProduktSortKey): SortRichtung {
  return key === "geaendert" ? "desc" : "asc";
}

// Liest Sortier-Spalte und -Richtung robust aus der URL.
export function parseSort(
  sort: string | undefined,
  dir: string | undefined,
): { key: ProduktSortKey; dir: SortRichtung } {
  const key: ProduktSortKey = sort === "name" || sort === "status" ? sort : "geaendert";
  const richtung: SortRichtung =
    dir === "asc" || dir === "desc" ? dir : standardRichtung(key);
  return { key, dir: richtung };
}

// Alle eigenen Produkte, sortiert nach Spalte + Richtung. Standard: neueste zuerst.
export async function getMeineProdukte(
  supabase: DB,
  key: ProduktSortKey = "geaendert",
  dir: SortRichtung = "desc",
): Promise<Product[]> {
  const ascending = dir === "asc";
  let query = supabase.from("products").select("*").order(SORT_SPALTE[key], { ascending });
  // Beim Sortieren nach Status zusätzlich stabil nach Datum (neueste zuerst).
  if (key === "status") {
    query = query.order("updated_at", { ascending: false });
  }
  const { data, error } = await query;
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

// Produkt aktiv veröffentlichen. Der zentrale canPublish-Check läuft direkt
// vor dem Statuswechsel erneut auf dem Server (PP-011 + PP-012).
export async function veroeffentlicheProdukt(
  supabase: DB,
  id: string,
): Promise<VeroeffentlichenErgebnis> {
  const [produkt, materialien] = await Promise.all([
    getProdukt(supabase, id),
    getMaterialien(supabase, id),
  ]);
  if (!produkt) return { ok: false, reasons: ["Produkt nicht gefunden."] };

  const check = canPublish(
    produkt,
    materialien.map((material) => ({
      materialName: material.material_name,
      percentage: Number(material.percentage),
    })),
  );
  if (!check.ok) return check;

  await updateProdukt(supabase, id, { status: "veroeffentlicht" });
  return { ok: true, reasons: [] };
}

// Veröffentlichung aufheben und den internen Status neu aus den Pflichtfeldern
// ableiten. Der Startwert „entwurf" erzwingt die Neuberechnung (PP-011).
export async function zieheProduktZurueck(supabase: DB, id: string): Promise<Product> {
  const produkt = await getProdukt(supabase, id);
  if (!produkt) throw new Error("Produkt nicht gefunden.");

  const status = leiteStatusAb(produkt, "entwurf");
  return updateProdukt(supabase, id, { status });
}

// Ein Produkt löschen (RLS lässt nur eigene zu).
export async function deleteProdukt(supabase: DB, id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// --- Materialien: Datenzugriff (product_materials, 1:n) ----------------------
// RLS (PP-017) stellt sicher, dass nur eigene Produktzeilen sichtbar/änderbar sind.

export type Material = Database["public"]["Tables"]["product_materials"]["Row"];

// Alle Materialien eines Produkts, in Eingabereihenfolge (älteste zuerst).
export async function getMaterialien(supabase: DB, productId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from("product_materials")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Materialien eines Produkts speichern.
// Strategie „replace all": erst alle alten Zeilen löschen, dann die neuen einfügen.
// Einfach und fürs MVP ausreichend (kleine Mengen, nur eigene Zeilen per RLS).
// PP-012: Eine Summe über 100 % wird hier serverseitig verhindert (harte Prüfung).
export async function saveMaterialien(
  supabase: DB,
  productId: string,
  materials: MaterialInput[],
): Promise<void> {
  // Leere Zeilen (ohne Namen) verwerfen, Namen säubern.
  const bereinigt = materials
    .map((m) => ({ materialName: m.materialName.trim(), percentage: m.percentage }))
    .filter((m) => m.materialName.length > 0);

  if (checkMaterialShares(bereinigt).isOverLimit) {
    throw new Error("Die Materialanteile ergeben mehr als 100%.");
  }

  // Alte Zeilen entfernen …
  const { error: delError } = await supabase
    .from("product_materials")
    .delete()
    .eq("product_id", productId);
  if (delError) throw delError;

  // … nichts mehr einzufügen? Dann fertig.
  if (bereinigt.length === 0) return;

  const { error: insError } = await supabase.from("product_materials").insert(
    bereinigt.map((m) => ({
      product_id: productId,
      material_name: m.materialName,
      percentage: m.percentage,
    })),
  );
  if (insError) throw insError;
}

// --- Textildaten: Datenzugriff (product_textile_data, 1:1) -------------------
// Eine Zeile pro Produkt (product_id ist Primärschlüssel). Sie hält die
// Produktdetails (Herkunft/Farbe/Größe) UND die Pflegehinweise. RLS (PP-017)
// sichert den Zugriff ab.

export type Textildaten = Database["public"]["Tables"]["product_textile_data"]["Row"];

export type TextileInput = {
  originCountry: string | null;
  color: string | null;
  size: string | null;
  careInstructions: string | null;
  washInstructions: string | null;
};

// Textildaten eines Produkts lesen (höchstens eine Zeile).
export async function getTextildaten(
  supabase: DB,
  productId: string,
): Promise<Textildaten | null> {
  const { data, error } = await supabase
    .from("product_textile_data")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Textildaten speichern (Upsert der ganzen 1:1-Zeile).
// Sind ALLE Felder leer, wird keine leere Zeile angelegt bzw. eine vorhandene
// entfernt — die Tabelle bleibt sauber.
export async function saveTextildaten(
  supabase: DB,
  productId: string,
  daten: TextileInput,
): Promise<void> {
  const zeile = {
    product_id: productId,
    origin_country: daten.originCountry,
    color: daten.color,
    size: daten.size,
    care_instructions: daten.careInstructions,
    wash_instructions: daten.washInstructions,
  };

  const allesLeer =
    !zeile.origin_country &&
    !zeile.color &&
    !zeile.size &&
    !zeile.care_instructions &&
    !zeile.wash_instructions;

  if (allesLeer) {
    const { error } = await supabase
      .from("product_textile_data")
      .delete()
      .eq("product_id", productId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("product_textile_data")
    .upsert(zeile, { onConflict: "product_id" });
  if (error) throw error;
}

// --- Nutzung & Kreislauf: Datenzugriff (product_sustainability, 1:1) ---------
// Eine Zeile pro Produkt (product_id ist Primärschlüssel). RLS (PP-017) sichert
// den Zugriff ab. Wie bei den Textildaten spiegelt das Formular die ganze Zeile.

export type Nachhaltigkeit =
  Database["public"]["Tables"]["product_sustainability"]["Row"];

export type NachhaltigkeitInput = {
  recyclingNotes: string | null;
  repairNotes: string | null;
  disposalNotes: string | null;
  reusableMaterials: string | null;
};

// Nachhaltigkeitsdaten eines Produkts lesen (höchstens eine Zeile).
export async function getNachhaltigkeit(
  supabase: DB,
  productId: string,
): Promise<Nachhaltigkeit | null> {
  const { data, error } = await supabase
    .from("product_sustainability")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Nachhaltigkeitsdaten speichern (Upsert der ganzen 1:1-Zeile).
// Sind ALLE Felder leer, wird keine leere Zeile angelegt bzw. eine vorhandene
// entfernt — die Tabelle bleibt sauber.
export async function saveNachhaltigkeit(
  supabase: DB,
  productId: string,
  daten: NachhaltigkeitInput,
): Promise<void> {
  const zeile = {
    product_id: productId,
    recycling_notes: daten.recyclingNotes,
    repair_notes: daten.repairNotes,
    disposal_notes: daten.disposalNotes,
    reusable_materials: daten.reusableMaterials,
  };

  const allesLeer =
    !zeile.recycling_notes &&
    !zeile.repair_notes &&
    !zeile.disposal_notes &&
    !zeile.reusable_materials;

  if (allesLeer) {
    const { error } = await supabase
      .from("product_sustainability")
      .delete()
      .eq("product_id", productId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("product_sustainability")
    .upsert(zeile, { onConflict: "product_id" });
  if (error) throw error;
}
