import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createFixtures, type Fixtures } from "./fixtures";
import { checkMaterialShares, getProdukt, veroeffentlicheProdukt, zieheProduktZurueck } from "@/lib/services/products";
import type { Database } from "@/lib/types/database.types";

let fixture: Fixtures;
beforeAll(async () => { fixture = await createFixtures(); });
afterAll(async () => { await fixture?.cleanup(); });

async function product(status: "entwurf" | "veroeffentlicht" = "entwurf") {
  const { data, error } = await fixture.a.client.from("products").insert({
    manufacturer_id: fixture.a.company.id, name: "B4-Shirt", description: "Testprodukt", category: "Textil", status,
  }).select().single();
  if (error) throw error;
  return data;
}

function saveArgs(id: string, overrides: Partial<Database["public"]["Functions"]["save_product"]["Args"]> = {}) {
  return {
    p_product_id: id, p_name: "Neu", p_description: "Neue Beschreibung", p_category: "Textil", p_brand: "Test",
    p_expected_status: "entwurf" as const,
    p_materials: [{ material_name: "Baumwolle", percentage: 80 }],
    p_textile_data: { color: "Blau", size: "M" }, p_sustainability: { repair_notes: "Reparierbar" },
    ...overrides,
  };
}

describe("B4: direkte Datenbank-Schreibwege", () => {
  it.each(["name", "description", "category"] as const)("direkte Veröffentlichung verlangt %s", async (field) => {
    const p = await product();
    const patch: Database["public"]["Tables"]["products"]["Update"] = { [field]: " \t\r\n\u00a0\ufeff", status: "veroeffentlicht" };
    const result = await fixture.a.client.from("products").update(patch).eq("id", p.id);
    expect(result.error?.code).toBe("23514");
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("entwurf");
  });

  it("direktes Anlegen eines unvollständigen veröffentlichten Produkts scheitert", async () => {
    const result = await fixture.a.client.from("products").insert({
      manufacturer_id: fixture.a.company.id, name: "", description: "Text", category: "Textil", status: "veroeffentlicht",
    });
    expect(result.error?.code).toBe("23514");
  });

  it.each(["name", "description", "category"] as const)("veröffentlichtes Produkt verliert %s nicht", async (field) => {
    const p = await product("veroeffentlicht");
    const patch: Database["public"]["Tables"]["products"]["Update"] = { [field]: "" };
    const result = await fixture.a.client.from("products").update(patch).eq("id", p.id);
    expect(result.error?.code).toBe("23514");
    expect((await getProdukt(fixture.a.client, p.id))?.[field]).toBe(p[field]);
  });

  it("direkte Material-Inserts können zusammen nicht mehr als 100 ergeben", async () => {
    const p = await product();
    const result = await fixture.a.client.from("product_materials").insert([
      { product_id: p.id, material_name: "A", percentage: 60 },
      { product_id: p.id, material_name: "B", percentage: 50 },
    ]);
    expect(result.error?.code).toBe("23514");
    expect((await fixture.a.client.from("product_materials").select().eq("product_id", p.id)).data).toEqual([]);
  });

  it("direkte Updates, Upserts und Produktwechsel halten die Summengrenze ein", async () => {
    const p = await product();
    const q = await product();
    const inserted = await fixture.a.client.from("product_materials").insert([
      { product_id: p.id, material_name: "A", percentage: 60 },
      { product_id: p.id, material_name: "B", percentage: 40 },
      { product_id: q.id, material_name: "C", percentage: 10 },
    ]).select();
    expect(inserted.error).toBeNull();
    const rows = inserted.data!;
    const b = rows.find((r) => r.material_name === "B")!;
    const c = rows.find((r) => r.material_name === "C")!;
    expect((await fixture.a.client.from("product_materials").update({ percentage: 41 }).eq("id", b.id)).error?.code).toBe("23514");
    expect((await fixture.a.client.from("product_materials").upsert({ ...b, percentage: 41 })).error?.code).toBe("23514");
    expect((await fixture.a.client.from("product_materials").update({ product_id: p.id }).eq("id", c.id)).error?.code).toBe("23514");
    expect((await fixture.a.client.from("product_materials").delete().eq("id", b.id)).error).toBeNull();
    expect((await fixture.a.client.from("product_materials").update({ product_id: p.id }).eq("id", c.id)).error).toBeNull();
  });

  it.each([null, -1, 101])("direkter ungültiger Einzelanteil %s wird abgewiesen", async (percentage) => {
    const p = await product();
    const result = await fixture.a.client.from("product_materials").insert({
      product_id: p.id, material_name: "A", percentage: percentage as number,
    });
    expect(["23502", "23514"]).toContain(result.error?.code);
  });
});

describe("B4: RPC, Rundung und Statusvertrag", () => {
  it("RPC und direkte API prüfen die Summe nach Rundung jeder Zeile", async () => {
    const p = await product();
    const materials = [{ material_name: "A", percentage: 33.335 }, { material_name: "B", percentage: 33.335 }, { material_name: "C", percentage: 33.33 }];
    expect(checkMaterialShares(materials.map((m) => ({ materialName: m.material_name, percentage: m.percentage }))).sum).toBe(100.01);
    expect((await fixture.a.client.rpc("replace_product_materials", { p_product_id: p.id, p_materials: materials })).error?.code).toBe("23514");
    expect((await fixture.a.client.rpc("save_product", saveArgs(p.id, { p_materials: materials }))).error?.code).toBe("23514");
    expect((await fixture.a.client.from("product_materials").insert(materials.map((m) => ({ ...m, product_id: p.id })))).error?.code).toBe("23514");
    expect((await getProdukt(fixture.a.client, p.id))?.name).toBe(p.name);
  });

  it.each([[], [{ material_name: "A", percentage: 80 }], [{ material_name: "A", percentage: 1.005 }, { material_name: "B", percentage: 98.994 }]].map((materials) => ({ materials })))("gültige gerundete Anteile erlauben Veröffentlichung: $materials", async ({ materials }) => {
    const p = await product();
    expect((await fixture.a.client.rpc("replace_product_materials", { p_product_id: p.id, p_materials: materials })).error).toBeNull();
    expect(await veroeffentlicheProdukt(fixture.a.client, p.id)).toEqual({ ok: true, reasons: [] });
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("veroeffentlicht");
  });

  it("Speichern leitet den Entwurfsstatus ab und kann nicht veröffentlichen", async () => {
    const p = await product();
    expect((await fixture.a.client.rpc("save_product", saveArgs(p.id, { p_name: "" }))).error).toBeNull();
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("unvollstaendig");
    expect((await fixture.a.client.rpc("save_product", saveArgs(p.id, { p_expected_status: "unvollstaendig" }))).error).toBeNull();
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("entwurf");
    expect((await fixture.a.client.rpc("save_product", saveArgs(p.id, { p_expected_status: "veroeffentlicht" }))).error?.code).toBe("40001");
  });

  it("unvollständiger Pass bleibt privat; veröffentlichter Pass behält Pflichtfelder beim RPC-Speichern", async () => {
    const p = await product();
    expect((await fixture.a.client.from("products").update({ name: "" }).eq("id", p.id)).error).toBeNull();
    expect((await veroeffentlicheProdukt(fixture.a.client, p.id)).ok).toBe(false);
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("entwurf");
    const q = await product("veroeffentlicht");
    expect((await fixture.a.client.rpc("save_product", saveArgs(q.id, { p_expected_status: "veroeffentlicht", p_description: "" }))).error?.code).toBe("23514");
    expect((await getProdukt(fixture.a.client, q.id))?.description).toBe(q.description);
    expect((await fixture.a.client.rpc("save_product", saveArgs(q.id, { p_expected_status: "veroeffentlicht" }))).error).toBeNull();
    expect((await getProdukt(fixture.a.client, q.id))?.status).toBe("veroeffentlicht");
  });

  it("veraltetes Speichern hebt weder Veröffentlichung noch Rücknahme auf", async () => {
    const p = await product();
    expect((await veroeffentlicheProdukt(fixture.a.client, p.id)).ok).toBe(true);
    expect((await fixture.a.client.rpc("save_product", saveArgs(p.id))).error?.code).toBe("40001");
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("veroeffentlicht");
    await zieheProduktZurueck(fixture.a.client, p.id);
    expect((await fixture.a.client.rpc("save_product", saveArgs(p.id, { p_expected_status: "veroeffentlicht" }))).error?.code).toBe("40001");
    expect((await getProdukt(fixture.a.client, p.id))?.status).toBe("entwurf");
  });

  it("B und anon erhalten über keinen neuen RPC fremde Schreibrechte", async () => {
    const p = await product();
    for (const client of [fixture.b.client, fixture.anon]) {
      for (const rpc of ["publish_product", "withdraw_product"] as const) {
        expect((await client.rpc(rpc, { p_product_id: p.id })).error?.code).toBe("42501");
      }
      expect((await client.rpc("save_product", saveArgs(p.id))).error?.code).toBe("42501");
      expect((await client.rpc("replace_product_materials", { p_product_id: p.id, p_materials: [] })).error?.code).toBe("42501");
    }
    expect((await fixture.a.client.rpc("publish_product", { p_product_id: randomUUID() })).error?.code).toBe("42501");
    expect((await getProdukt(fixture.a.client, p.id))?.name).toBe(p.name);
  });
});
