import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { createFixtures, pdfBytes, type Fixtures } from "./fixtures";
import { completeDocumentUpload, completeImageUpload, validateStoredUpload } from "@/lib/services/upload-completion";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";
import { bereinigeDatei, bereinigeProduktdateien } from "@/lib/services/file-cleanup";
import { deleteProdukt, getOeffentlicherPass, getProdukt } from "@/lib/services/products";
import { MAX_DATEI_BYTES } from "@/lib/uploads/contract";

let fixture: Fixtures;
const meta = { name: "Prüfung", docType: null, description: null };
beforeAll(async () => { fixture = await createFixtures(); });
afterAll(async () => {
  if (!fixture) return;
  for (const owner of [fixture.a, fixture.b]) {
    const ops = await owner.client.from("file_operations").select("file_path");
    if (ops.data?.length) await owner.client.storage.from(DOKUMENTE_BUCKET).remove(ops.data.map(x => x.file_path));
  }
  await fixture.cleanup();
});
async function product() {
  const p = await fixture.a.client.from("products").insert({ manufacturer_id: fixture.a.company.id, name: "B5 Test", description: "Synthetisch", category: "Textil" }).select().single();
  if (p.error) throw p.error;
  return p.data;
}
async function upload(productId: string, purpose: "image" | "document" = "image", bytes?: Uint8Array, mime = "image/png", name = "bild.png") {
  const r = await fixture.a.client.rpc("reserve_file_upload", { p_product_id: productId, p_file_name: name, p_purpose: purpose });
  if (r.error) throw r.error;
  const content = bytes ?? await sharp({ create: { width: 8, height: 8, channels: 3, background: "red" } }).png().toBuffer();
  const stored = await fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(r.data.file_path, content, { contentType: mime });
  if (stored.error) throw stored.error;
  return r.data;
}
async function state(id: string) {
  const result = await fixture.a.client.from("file_operations").select().eq("id", id).single();
  if (result.error) throw result.error;
  return result.data;
}

describe("B5/N7: privater Direktupload und bestätigter Abschluss", () => {
  it("blockiert ungeprüfte Direktbindung als Dokument und Produktbild", async () => {
    const p = await product(); const op = await upload(p.id);
    expect((await fixture.a.client.from("products").update({ image_url: op.file_path }).eq("id", p.id)).error?.code).toBe("23514");
    expect((await fixture.a.client.from("documents").insert({ product_id: p.id, name: "Ungeprüft", file_path: op.file_path })).error?.code).toBe("23514");
    expect((await fixture.anon.storage.from(DOKUMENTE_BUCKET).download(op.file_path)).error).not.toBeNull();
    expect((await fixture.a.client.rpc("mark_file_validated", { p_operation_id: op.id, p_owner_id: op.owner_id })).error?.code).toBe("42501");
    expect((await fixture.a.client.from("file_operations").update({ validated: true }).eq("id", op.id)).error?.code).toBe("42501");
    await bereinigeDatei(fixture.a.client, op.id);
  });
  it("verwirft HTML mit PDF-MIME und erhält das bisherige Bild", async () => {
    const p = await product(); const old = await upload(p.id);
    await completeImageUpload(fixture.a.client, fixture.verifier, old.id, null);
    const bad = await upload(p.id, "document", Buffer.from("<html>gefälscht</html>"), "application/pdf", "fake.pdf");
    await expect(completeDocumentUpload(fixture.a.client, fixture.verifier, bad.id, meta)).rejects.toThrow();
    expect((await state(bad.id)).validated).toBe(false);
    expect((await getProdukt(fixture.a.client, p.id))?.image_url).toBe(old.file_path);
    expect((await bereinigeDatei(fixture.a.client, bad.id)).complete).toBe(true);
  });
  it("bestätigt eine echte Datei über 4,5 MB bis zur 10-MiB-Grenze ohne großen Actionbody", async () => {
    const p = await product();
    const base = Buffer.from(await pdfBytes());
    const tail = base.lastIndexOf("%%EOF");
    const bytes = Buffer.concat([base.subarray(0, tail), Buffer.alloc(MAX_DATEI_BYTES - base.length, 32), base.subarray(tail)]);
    const op = await upload(p.id, "document", bytes, "application/pdf", "gross.pdf");
    const d = await completeDocumentUpload(fixture.a.client, fixture.verifier, op.id, meta);
    expect(d.file_path).toBe(op.file_path);
    expect((await state(op.id)).validated).toBe(true);
  });
  it("Storage weist nicht erlaubtes MIME und mehr als 10 MiB bereits beim Direktupload ab", async () => {
    const p = await product();
    const op = await fixture.a.client.rpc("reserve_file_upload", { p_product_id: p.id, p_file_name: "gross.pdf", p_purpose: "document" });
    expect(op.error).toBeNull();
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(op.data!.file_path, Buffer.from("HTML"), { contentType: "text/html" })).error).not.toBeNull();
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(op.data!.file_path, Buffer.alloc(MAX_DATEI_BYTES + 1), { contentType: "application/pdf" })).error).not.toBeNull();
    await bereinigeDatei(fixture.a.client, op.data!.id);
  });
  it("eingefrorene/geprüfte Inhalte sind weder überschreibbar noch nach Löschung wieder befüllbar", async () => {
    const p = await product(); const op = await upload(p.id);
    await validateStoredUpload(fixture.a.client, fixture.verifier, op.id);
    const bucket = fixture.a.client.storage.from(DOKUMENTE_BUCKET);
    expect((await bucket.update(op.file_path, Buffer.from("falsch"), { contentType: "image/png" })).error).not.toBeNull();
    expect((await bucket.upload(op.file_path, Buffer.from("falsch"), { contentType: "image/png", upsert: true })).error).not.toBeNull();
    expect((await bucket.remove([op.file_path])).error).toBeNull();
    expect((await bucket.upload(op.file_path, Buffer.from("falsch"), { contentType: "image/png" })).error).not.toBeNull();
    await expect(completeImageUpload(fixture.a.client, fixture.verifier, op.id, null)).rejects.toBeDefined();
    await bereinigeDatei(fixture.a.client, op.id);
  });
  it("fremder Hersteller und anon können weder prüfen noch binden noch Bilder ändern", async () => {
    const p = await product(); const op = await upload(p.id);
    for (const client of [fixture.b.client, fixture.anon]) {
      expect((await client.rpc("begin_file_validation", { p_operation_id: op.id })).error?.code).toBe("42501");
      expect((await client.rpc("attach_document_upload", { p_operation_id: op.id, p_name: "Fremd", p_doc_type: "", p_description: "" })).error?.code).toBe("42501");
      expect((await client.rpc("set_product_image", { p_product_id: p.id, p_expected_path: null!, p_new_path: op.file_path })).error?.code).toBe("42501");
      await expect(validateStoredUpload(client, fixture.verifier, op.id)).rejects.toBeDefined();
    }
    expect((await state(op.id)).validated).toBe(false);
    await bereinigeDatei(fixture.a.client, op.id);
  });
  it("parallel wiederholter Dokumentabschluss erzeugt nur eine Zeile", async () => {
    const p = await product(); const op = await upload(p.id, "document", await pdfBytes(), "application/pdf", "test.pdf");
    const [a, b] = await Promise.all([completeDocumentUpload(fixture.a.client, fixture.verifier, op.id, meta), completeDocumentUpload(fixture.a.client, fixture.verifier, op.id, meta)]);
    expect(a.id).toBe(b.id);
    expect((await fixture.a.client.from("documents").select("id").eq("file_path", op.file_path)).data).toHaveLength(1);
  });
  it("Bildtausch räumt das alte Bild auf; konkurrierender Wechsel wird abgewiesen", async () => {
    const p = await product(); const old = await upload(p.id); const next = await upload(p.id); const stale = await upload(p.id);
    await completeImageUpload(fixture.a.client, fixture.verifier, old.id, null);
    await completeImageUpload(fixture.a.client, fixture.verifier, next.id, old.file_path);
    expect((await state(old.id)).state).toBe("deleted");
    await expect(completeImageUpload(fixture.a.client, fixture.verifier, stale.id, old.file_path)).rejects.toMatchObject({ code: "40001" });
    expect((await getProdukt(fixture.a.client, p.id))?.image_url).toBe(next.file_path);
    expect((await fixture.a.client.rpc("set_product_image", { p_product_id: p.id, p_expected_path: next.file_path, p_new_path: null! })).error).toBeNull();
    expect((await bereinigeProduktdateien(fixture.a.client, p.id)).complete).toBe(true);
    expect((await state(next.id)).state).toBe("deleted");
    await bereinigeDatei(fixture.a.client, stale.id);
  });
  it("öffentlich nur aktuelles Bild eines veröffentlichten Produkts; Rücknahme sperrt neue Abrufe", async () => {
    const p = await product(); const op = await upload(p.id);
    await completeImageUpload(fixture.a.client, fixture.verifier, op.id, null);
    expect((await fixture.anon.storage.from(DOKUMENTE_BUCKET).createSignedUrl(op.file_path, 60)).error).not.toBeNull();
    expect((await fixture.a.client.rpc("publish_product", { p_product_id: p.id })).error).toBeNull();
    const pass = await getOeffentlicherPass(fixture.anon, p.public_id);
    expect(pass?.produkt.image_url).toContain("/storage/v1/object/sign/");
    expect((await fixture.anon.storage.from(DOKUMENTE_BUCKET).download(op.file_path)).error).toBeNull();
    expect((await fixture.b.client.storage.from(DOKUMENTE_BUCKET).download(op.file_path)).error).toBeNull();
    expect((await fixture.a.client.rpc("withdraw_product", { p_product_id: p.id })).error).toBeNull();
    expect((await fixture.anon.storage.from(DOKUMENTE_BUCKET).download(op.file_path)).error).not.toBeNull();
    expect((await deleteProdukt(fixture.a.client, p.id)).complete).toBe(true);
    expect((await state(op.id)).state).toBe("deleted");
  });
  it("abgebrochener Bildvorgang bleibt löschbar und kann nicht später gebunden werden", async () => {
    const p = await product(); const op = await upload(p.id);
    await bereinigeDatei(fixture.a.client, op.id);
    await expect(completeImageUpload(fixture.a.client, fixture.verifier, op.id, null)).rejects.toBeDefined();
    expect((await getProdukt(fixture.a.client, p.id))?.image_url).toBeNull();
  });
});

describe("N7: Artikelnummer bleibt optional, intern und atomar", () => {
  it("speichert führende Nullen und rollt alle Formularbereiche bei Fehler zurück", async () => {
    const p = await product();
    const args = { p_product_id: p.id, p_name: "Geändert", p_description: "Beschreibung", p_category: "Textil", p_brand: "Marke", p_expected_status: "entwurf" as const, p_materials: [{ material_name: "Baumwolle", percentage: 100 }], p_textile_data: { color: "Rot" }, p_sustainability: { repair_notes: "Neu" }, p_article_number: "00123-A" };
    expect((await fixture.a.client.rpc("save_product_with_article", args)).error).toBeNull();
    expect((await getProdukt(fixture.a.client, p.id))?.article_number).toBe("00123-A");
    const tables = async () => Promise.all([fixture.a.client.from("products").select().eq("id", p.id), fixture.a.client.from("product_materials").select().eq("product_id", p.id), fixture.a.client.from("product_textile_data").select().eq("product_id", p.id), fixture.a.client.from("product_sustainability").select().eq("product_id", p.id)]).then(rows => rows.map(r => r.data));
    const before = await tables();
    expect((await fixture.a.client.rpc("save_product_with_article", { ...args, p_name: "Fehler", p_article_number: "X".repeat(121), p_textile_data: { color: "Blau" }, p_sustainability: { repair_notes: "Fehler" }, p_materials: [] })).error?.code).toBe("23514");
    expect(await tables()).toEqual(before);
    expect((await fixture.a.client.rpc("publish_product", { p_product_id: p.id })).error).toBeNull();
    expect((await fixture.anon.from("products").select("article_number").eq("id", p.id)).error?.code).toBe("42501");
    expect(JSON.stringify(await getOeffentlicherPass(fixture.anon, p.public_id))).not.toContain("00123-A");
    expect((await fixture.a.client.rpc("save_product_with_article", { ...args, p_expected_status: "veroeffentlicht", p_article_number: "  " })).error).toBeNull();
    expect((await getProdukt(fixture.a.client, p.id))?.article_number).toBeNull();
  });
});
