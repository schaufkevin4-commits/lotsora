import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { createFixtures, type Fixtures } from "./fixtures";
import { asManufacturer, sql, sqlSession } from "./sql";
import { bereinigeDatei, bereinigeProduktdateien } from "@/lib/services/file-cleanup";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";

let fixture: Fixtures;
beforeAll(async () => { fixture = await createFixtures(); });
afterAll(async () => { await fixture?.cleanup(); });

async function reservation() {
  const p = await fixture.a.client.from("products").insert({ manufacturer_id: fixture.a.company.id, name: "B3 parallel", description: "Test", category: "Textil" }).select().single();
  if (p.error) throw p.error;
  const op = await fixture.a.client.rpc("reserve_document_upload", { p_product_id: p.data.id, p_file_name: "parallel.pdf" });
  if (op.error) throw op.error;
  return op.data;
}

async function waitForBlockedRequest(table: "storage" | "documents") {
  await vi.waitFor(async () => {
    const result = await sql(`select count(*) from pg_stat_activity where wait_event_type = 'Lock' and query ilike '%${table}%' and pid <> pg_backend_pid();`);
    expect(result.code).toBe(0);
    expect(Number(result.output.trim())).toBeGreaterThan(0);
  }, { timeout: 4_000, interval: 50 });
}

it("Storage-Upload wartet auf Produktlöschung und wird danach abgewiesen", async () => {
  const op = await reservation();
  const transaction = sqlSession();
  try {
    await transaction.query(`${asManufacturer(fixture.a.company.user_id)} delete from public.products where id = '${op.product_id}';`);
    const uploading = fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(op.file_path, "B3 parallel");
    await waitForBlockedRequest("storage");
    transaction.end("commit;");
    expect((await transaction.done).code).toBe(0);
    expect((await uploading).error).not.toBeNull();
    expect(await bereinigeProduktdateien(fixture.a.client, op.product_id)).toEqual({ complete: true });
  } finally { transaction.end("rollback;"); await transaction.done; }
});

it("Dokumentbindung kann eine bereits begonnene Dateibereinigung nicht überholen", async () => {
  const op = await reservation();
  expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(op.file_path, "B3 parallel")).error).toBeNull();
  const transaction = sqlSession();
  try {
    await transaction.query(`${asManufacturer(fixture.a.company.user_id)} select public.begin_file_cleanup('${op.id}');`);
    const attaching = Promise.resolve(fixture.a.client.from("documents").insert({ product_id: op.product_id, name: "Zu spät", file_path: op.file_path }));
    await waitForBlockedRequest("documents");
    transaction.end("commit;");
    expect((await transaction.done).code).toBe(0);
    expect((await attaching).error?.code).toBe("23514");
    expect(await bereinigeDatei(fixture.a.client, op.id)).toEqual({ complete: true });
  } finally { transaction.end("rollback;"); await transaction.done; }
});
