import { saveFixtureProduct, publishFixtureProduct } from "./product-write";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createFixtures, type Fixtures } from "./fixtures";
import { asManufacturer, sql, sqlSession } from "./sql";

let fixture: Fixtures;
beforeAll(async () => { fixture = await createFixtures(); });
afterAll(async () => { await fixture?.cleanup(); });

async function product() {
  const { data, error } = await fixture.a.client.from("products").insert({
    manufacturer_id: fixture.a.company.id, name: "Parallel-Shirt", description: "Test", category: "Textil", status: "entwurf",
  }).select().single();
  if (error) throw error;
  return data;
}

// Nur der SQL-Testharness darf interne Trigger-Invarianten direkt ausüben.
// Normale API-Sessions erhalten diese Rolle nicht (product-write-boundary.test.ts).
function asInternalWriter(id: string, isolation = "read committed") {
  return asManufacturer(id, isolation) + "set local role lotsora_product_writer; select current_user;";
}
function saveSql(id: string, expected = "entwurf", name = "Neuer Name") {
  return `select public.save_product('${id}', '${name}', 'Neue Beschreibung', 'Textil', 'Neue Marke', '${expected}',
    '[{"material_name":"Leinen","percentage":90}]', '{"color":"Rot"}', '{"repair_notes":"Neue Notiz"}');`;
}

async function snapshot(id: string) {
  const [products, materials, textile, sustainability] = await Promise.all([
    fixture.a.client.from("products").select().eq("id", id),
    fixture.a.client.from("product_materials").select().eq("product_id", id).order("id"),
    fixture.a.client.from("product_textile_data").select().eq("product_id", id),
    fixture.a.client.from("product_sustainability").select().eq("product_id", id),
  ]);
  for (const result of [products, materials, textile, sustainability]) expect(result.error).toBeNull();
  return [products.data, materials.data, textile.data, sustainability.data];
}

async function blocked(applicationName: string) {
  await vi.waitFor(async () => {
    const state = await sql(`select count(*) from pg_stat_activity where application_name = '${applicationName}' and wait_event_type = 'Lock';`);
    expect(state.code).toBe(0);
    expect(state.output.trim()).toBe("1");
  }, { timeout: 4_000, interval: 50 });
}

describe("B4: interne Trigger-Invarianten unter konkurrierenden Transaktionen", () => {
  it.each(["read committed", "repeatable read"])("konkurrierende Material-Inserts überschreiten 100 nicht (%s)", async (isolation) => {
    const p = await product();
    const first = sqlSession();
    const second = sqlSession();
    const label = `b4_${randomUUID()}`;
    try {
      const actor = await first.query(asInternalWriter(fixture.a.company.user_id));
      expect(actor).toContain("lotsora_product_writer");
      await second.query(asInternalWriter(fixture.a.company.user_id, isolation));
      await first.query(`insert into public.product_materials(product_id, material_name, percentage) values ('${p.id}', 'A', 60);`);
      second.end(`set application_name = '${label}'; insert into public.product_materials(product_id, material_name, percentage) values ('${p.id}', 'B', 50); commit;`);
      await blocked(label);
      first.end("commit;");
      expect((await first.done).code).toBe(0);
      const rejected = await second.done;
      expect(rejected.code).not.toBe(0);
      expect(rejected.output).toContain(isolation === "read committed" ? "23514" : "40001");
      const rows = await fixture.a.client.from("product_materials").select("percentage").eq("product_id", p.id);
      expect(rows.data).toEqual([{ percentage: 60 }]);
    } finally { first.end("rollback;"); second.end("rollback;"); await Promise.all([first.done, second.done]); }
  });

  it("zwei Replace-all-Aufrufe vermischen keine Materiallisten", async () => {
    const p = await product();
    const first = sqlSession();
    const second = sqlSession();
    const label = `b4_${randomUUID()}`;
    try {
      await first.query(`${asInternalWriter(fixture.a.company.user_id)}
        select public.replace_product_materials('${p.id}', '[{"material_name":"A","percentage":60}]');`);
      second.end(`${asInternalWriter(fixture.a.company.user_id)} set application_name = '${label}';
        select public.replace_product_materials('${p.id}', '[{"material_name":"B","percentage":70}]'); commit;`);
      await blocked(label);
      first.end("commit;");
      expect((await first.done).code).toBe(0);
      expect((await second.done).code).toBe(0);
      expect((await fixture.a.client.from("product_materials").select("material_name,percentage").eq("product_id", p.id)).data).toEqual([{ material_name: "B", percentage: 70 }]);
    } finally { first.end("rollback;"); second.end("rollback;"); await Promise.all([first.done, second.done]); }
  });

  it("Veröffentlichen wartet auf Speichern und prüft dessen endgültige Pflichtfelder", async () => {
    const p = await product();
    const first = sqlSession();
    const second = sqlSession();
    const label = `b4_${randomUUID()}`;
    try {
      await first.query(`${asInternalWriter(fixture.a.company.user_id)} ${saveSql(p.id, "entwurf", "")}`);
      second.end(`${asInternalWriter(fixture.a.company.user_id)} set application_name = '${label}'; select public.publish_product('${p.id}'); commit;`);
      await blocked(label);
      first.end("commit;");
      expect((await first.done).code).toBe(0);
      const rejected = await second.done;
      expect(rejected.code).not.toBe(0);
      expect(rejected.output).toContain("23514");
      expect((await fixture.a.client.from("products").select("status,name").eq("id", p.id).single()).data).toEqual({ status: "unvollstaendig", name: "" });
    } finally { first.end("rollback;"); second.end("rollback;"); await Promise.all([first.done, second.done]); }
  });

  it.each(["publish", "withdraw"])("Speichern weist einen inzwischen geänderten Status ab (%s)", async (operation) => {
    const p = await product();
    if (operation === "withdraw") expect((await publishFixtureProduct(fixture.a.client, p.id, true)).error).toBeNull();
    const first = sqlSession();
    const second = sqlSession();
    const label = `b4_${randomUUID()}`;
    try {
      await first.query(`${asInternalWriter(fixture.a.company.user_id)} select public.${operation}_product('${p.id}');`);
      second.end(`${asInternalWriter(fixture.a.company.user_id)} set application_name = '${label}'; ${saveSql(p.id, operation === "withdraw" ? "veroeffentlicht" : "entwurf")} commit;`);
      await blocked(label);
      first.end("commit;");
      expect((await first.done).code).toBe(0);
      const rejected = await second.done;
      expect(rejected.code).not.toBe(0);
      expect(rejected.output).toContain("40001");
      expect((await fixture.a.client.from("products").select("status,name").eq("id", p.id).single()).data).toEqual({ status: operation === "withdraw" ? "entwurf" : "veroeffentlicht", name: p.name });
    } finally { first.end("rollback;"); second.end("rollback;"); await Promise.all([first.done, second.done]); }
  });
});

describe("B4: atomare Speicherung und gültige Zwischenstände", () => {
  it("später Fehler in Tabelle vier rollt alle vier Formularbereiche zurück", async () => {
    const p = await product();
    expect((await sql(`${asInternalWriter(fixture.a.company.user_id)} ${saveSql(p.id)} commit;`)).code).toBe(0);
    const before = await snapshot(p.id);
    // Fehler ausschließlich am synthetischen Produkt, immer im finally entfernen.
    const trigger = `b4_fail_${randomUUID().replaceAll("-", "")}`;
    try {
      const setup = await sql(`create function private.${trigger}() returns trigger language plpgsql set search_path = '' as $$ begin
        if new.product_id = '${p.id}'::uuid then raise exception 'B4 absichtlich später Testfehler' using errcode = '23514'; end if; return new; end $$;
        create trigger ${trigger} before insert or update on public.product_sustainability for each row execute function private.${trigger}();`);
      expect(setup.code).toBe(0);
      const response = await saveFixtureProduct(fixture.a.client, p.id, {
        p_product_id: p.id, p_expected_status: "entwurf", p_name: "Muss zurückrollen", p_description: "Neu", p_category: "Anders", p_brand: "Anders",
        p_materials: [{ material_name: "Wolle", percentage: 75 }], p_textile_data: { color: "Grün" }, p_sustainability: { repair_notes: "Muss zurückrollen" },
      });
      expect(response.error?.code).toBe("23514");
      expect(await snapshot(p.id)).toEqual(before);
    } finally {
      const cleanup = await sql(`drop trigger if exists ${trigger} on public.product_sustainability; drop function if exists private.${trigger}();`);
      expect(cleanup.code).toBe(0);
    }
  });

  it("Umverteilen und Löschen sind bei gültiger Endsumme möglich", async () => {
    const p = await product();
    const result = await sql(`${asInternalWriter(fixture.a.company.user_id)}
      insert into public.product_materials(product_id, material_name, percentage) values ('${p.id}', 'A', 60), ('${p.id}', 'B', 40);
      update public.product_materials set percentage = 70 where product_id = '${p.id}' and material_name = 'A';
      update public.product_materials set percentage = 30 where product_id = '${p.id}' and material_name = 'B'; commit;`);
    expect(result.code, result.output).toBe(0);
    expect((await fixture.a.client.from("products").delete().eq("id", p.id)).error).toBeNull();
    expect((await fixture.a.client.from("product_materials").select().eq("product_id", p.id)).data).toEqual([]);
  });

  it("eine ungültige Endsumme rollt auch bereits gespeicherte Formularbereiche zurück", async () => {
    const p = await product();
    const before = await snapshot(p.id);
    const result = await sql(`${asInternalWriter(fixture.a.company.user_id)} ${saveSql(p.id)}
      insert into public.product_materials(product_id, material_name, percentage) values ('${p.id}', 'Zusatz', 20); commit;`);
    expect(result.code).not.toBe(0);
    expect(result.output).toContain("product_materials_total_limit");
    expect(await snapshot(p.id)).toEqual(before);
  });
});

describe("B4: Migration bei ungültigen Altbeständen", () => {
  it.each(["Pflichtfelder", "Materialsumme", "fehlender Anteil"])("bricht bei %s ohne dauerhafte Daten-/Schemaänderungen ab", async (invalid) => {
    const p = await product();
    const before = await snapshot(p.id);
    const migration = readFileSync(new URL("../../supabase/migrations/20260914120000_veroeffentlichungsregeln.sql", import.meta.url), "utf8");
    const badData = invalid === "Pflichtfelder"
      ? `update public.products set name = '', status = 'veroeffentlicht' where id = '${p.id}';`
      : invalid === "Materialsumme"
        ? `insert into public.product_materials(product_id, material_name, percentage) values ('${p.id}', 'A', 60), ('${p.id}', 'B', 50);`
        : `insert into public.product_materials(product_id, material_name, percentage) values ('${p.id}', 'A', null);`;
    // Transaktion simuliert den Zustand vor B4. ON_ERROR_STOP schließt bei der
    // erwarteten Verletzung die Session; PostgreSQL rollt auch das Setup zurück.
    const result = await sql(`begin;
      alter table public.products drop constraint if exists products_published_required_fields;
      alter table public.product_materials drop constraint product_materials_name_not_blank, alter column percentage drop not null;
      drop trigger product_materials_total_limit on public.product_materials;
      ${badData}
      ${migration}
      rollback;`);
    expect(result.code).not.toBe(0);
    expect(result.output).toContain(invalid === "Pflichtfelder" ? "products_published_required_fields" : invalid === "Materialsumme" ? "Bestehende Materialsumme" : "contains null values");
    expect(await snapshot(p.id)).toEqual(before);
    expect((await fixture.a.client.from("products").update({ name: "", status: "veroeffentlicht" }).eq("id", p.id)).error?.code).toBe("42501");
  });
});
