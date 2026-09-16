import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createFixtures, type Fixtures } from "./fixtures";
import { asManufacturer, sql, sqlSession } from "./sql";

let fixture: Fixtures;
beforeAll(async () => { fixture = await createFixtures(); });
afterAll(async () => { await fixture?.cleanup(); });
async function product() {
  const { data, error } = await fixture.a.client.from("products").insert({ manufacturer_id: fixture.a.company.id, name: "N9", description: "Test", category: "Textil", status: "entwurf" }).select().single();
  if (error) throw error; return data;
}
function args(id: string, version: number) {
  return { p_product_id: id, p_expected_version: version, p_expected_status: "entwurf" as const,
    p_name: "Gespeichert", p_description: "Beschreibung", p_category: "Textil", p_brand: "", p_article_number: "001", p_materials: [{ material_name: "Leinen", percentage: 100 }], p_textile_data: { color: "Blau" }, p_sustainability: { repair_notes: "Naht" } };
}
describe("N9: Formularversion unter echter Produktsperre", () => {
  it("bestätigt die endgültige Version und weist den veralteten zweiten Tab ab", async () => {
    const p = await product(); const first = await fixture.a.client.rpc("save_product_checked", args(p.id, p.editor_version));
    expect(first.error).toBeNull(); expect(first.data).toBeGreaterThan(p.editor_version);
    const before = await fixture.a.client.from("products").select().eq("id", p.id).single();
    expect(before.data?.editor_version).toBe(first.data);
    const stale = await fixture.a.client.rpc("save_product_checked", { ...args(p.id, p.editor_version), p_name: "Veraltet" });
    expect(stale.error?.code).toBe("40001");
    expect((await fixture.a.client.from("products").select().eq("id", p.id).single()).data).toEqual(before.data);
    const second = await fixture.a.client.rpc("save_product_checked", { ...args(p.id, first.data!), p_materials: [] });
    expect(second.error).toBeNull();
    expect((await fixture.a.client.from("product_materials").select().eq("product_id", p.id)).data).toEqual([]);
  });
  it.each(["product_materials", "product_textile_data", "product_sustainability"] as const)("erkennt direkte Änderung an %s", async (table) => {
    const p = await product();
    const mutation = table === "product_materials"
      ? await fixture.a.client.from(table).insert({ product_id: p.id, material_name: "Seide", percentage: 50 })
      : table === "product_textile_data"
        ? await fixture.a.client.from(table).insert({ product_id: p.id, color: "Rot" })
        : await fixture.a.client.from(table).insert({ product_id: p.id, repair_notes: "Geändert" });
    expect(mutation.error).toBeNull();
    expect((await fixture.a.client.rpc("save_product_checked", args(p.id, p.editor_version))).error?.code).toBe("40001");
    expect((await fixture.a.client.rpc("set_product_publication_checked", { p_product_id: p.id, p_expected_version: p.editor_version, p_publish: true })).error?.code).toBe("40001");
  });
  it("weist fremde und anonyme Save-/Statuswechsel zurück", async () => {
    const p = await product();
    for (const client of [fixture.b.client, fixture.anon]) {
      expect((await client.rpc("save_product_checked", args(p.id, p.editor_version))).error?.code).toBe("42501");
      expect((await client.rpc("set_product_publication_checked", { p_product_id: p.id, p_expected_version: p.editor_version, p_publish: true })).error?.code).toBe("42501");
    }
  });
  it("veröffentlicht nur die geprüfte Version und führt Rücknahme mit neuer Version aus", async () => {
    const p = await product();
    const published = await fixture.a.client.rpc("set_product_publication_checked", { p_product_id: p.id, p_expected_version: p.editor_version, p_publish: true });
    expect(published.error).toBeNull();
    expect((await fixture.a.client.rpc("save_product_checked", args(p.id, p.editor_version))).error?.code).toBe("40001");
    const withdrawn = await fixture.a.client.rpc("set_product_publication_checked", { p_product_id: p.id, p_expected_version: published.data!, p_publish: false });
    expect(withdrawn.error).toBeNull(); expect(withdrawn.data).toBeGreaterThan(published.data!);
  });
  it("rollt auch das Bearbeitungstoken bei einem letzten Validierungsfehler zurück", async () => {
    const p = await product();
    const result = await fixture.a.client.rpc("save_product_checked", { ...args(p.id, p.editor_version), p_article_number: "x".repeat(121) });
    expect(result.error?.code).toBe("23514");
    expect((await fixture.a.client.from("products").select().eq("id", p.id).single()).data).toEqual(p);
    expect((await fixture.a.client.from("product_textile_data").select().eq("product_id", p.id)).data).toEqual([]);
  });
  it("zwei wartende Saves auf derselben Version lassen genau einen gewinnen", async () => {
    const p = await product(); const first = sqlSession(); const second = sqlSession(); const label = `n9_${randomUUID()}`;
    const save = `select public.save_product_checked('${p.id}',${p.editor_version},'Neu','Beschreibung','Textil','','entwurf','[]','{}','{}','');`;
    try {
      await first.query(`${asManufacturer(fixture.a.company.user_id)} ${save}`);
      second.end(`${asManufacturer(fixture.a.company.user_id)} set application_name = '${label}'; ${save} commit;`);
      await vi.waitFor(async () => expect((await sql(`select count(*) from pg_stat_activity where application_name = '${label}' and wait_event_type = 'Lock';`)).output.trim()).toBe("1"), { timeout: 4000, interval: 50 });
      first.end("commit;"); expect((await first.done).code).toBe(0);
      const rejected = await second.done; expect(rejected.code).not.toBe(0); expect(rejected.output).toContain("40001");
    } finally { first.end("rollback;"); second.end("rollback;"); await Promise.all([first.done, second.done]); }
  });
});
