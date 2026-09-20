import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { createFixtures, testConfig, type Fixtures } from "./fixtures";
import { sql } from "./sql";
import { getOeffentlicherPass } from "@/lib/services/products";
import { getPublicFile } from "@/lib/services/public-files";
import { createPublicClient } from "@/lib/supabase/public";
import { completeImageUpload } from "@/lib/services/upload-completion";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";

let f: Fixtures;
const images: string[] = [];
beforeAll(async () => {
  f = await createFixtures();
  const config = testConfig();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", config.url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", config.anonKey);
  for (const response of await Promise.all([
    f.a.client.from("product_textile_data").insert({ product_id: f.a.published.id, origin_country: "DE", color: "Blau", size: "M", care_instructions: "Lüften", wash_instructions: "30 Grad" }),
    f.a.client.from("product_sustainability").insert({ product_id: f.a.published.id, recycling_notes: "Trennen", repair_notes: "Nähen", disposal_notes: "Sammeln", reusable_materials: "Baumwolle" }),
  ])) if (response.error) throw response.error;
  await image(null);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  if (f) {
    if (images.length) await f.verifier.storage.from(DOKUMENTE_BUCKET).remove(images);
    await f.cleanup();
  }
});
async function image(old: string | null) {
  const op = await f.a.client.rpc("reserve_file_upload", { p_product_id: f.a.published.id, p_file_name: "n3.png", p_purpose: "image" });
  if (op.error) throw op.error;
  images.push(op.data.file_path);
  const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: old ? "blue" : "red" } }).png().toBuffer();
  const stored = await f.a.client.storage.from(DOKUMENTE_BUCKET).upload(op.data.file_path, bytes, { contentType: "image/png" });
  if (stored.error) throw stored.error;
  await completeImageUpload(f.a.client, f.verifier, op.data.id, old);
  return op.data.file_path;
}
async function signed(documentId?: string, seconds = 300) {
  const result = await getPublicFile(createPublicClient(), f.a.published.public_id, documentId, seconds);
  expect(result.status).toBe("available");
  if (result.status !== "available") throw new Error("Keine Dateierteilung");
  return result.url;
}
async function status(publish: boolean) {
  const response = await f.a.client.rpc(publish ? "publish_product" : "withdraw_product", { p_product_id: f.a.published.id });
  if (response.error) throw response.error;
}

describe("N3: öffentliche Aktualität und erneuerbare Dateien", () => {
  it("öffentlicher Leser liefert vollständige erlaubte Projektion; keine Signaturen im Pass", async () => {
    const pass = await getOeffentlicherPass(createPublicClient(), f.a.published.public_id);
    expect(pass?.textildaten).toEqual({ origin_country: "DE", color: "Blau", size: "M", care_instructions: "Lüften", wash_instructions: "30 Grad" });
    expect(pass?.nachhaltigkeit).toEqual({ recycling_notes: "Trennen", repair_notes: "Nähen", disposal_notes: "Sammeln", reusable_materials: "Baumwolle" });
    expect(pass?.hersteller).toEqual({ company_name: "Testfirma A", country: "DE", website: null });
    expect(pass?.dokumente).toEqual([{ id: f.a.publicDoc.id, name: f.a.publicDoc.name, doc_type: "Datenblatt", url: `/p/${f.a.published.public_id}/dokumente/${f.a.publicDoc.id}` }]);
    for (const privateValue of ["article_number", "editor_version", "contact_person", "file_path", "Interne Testnotiz", "token="]) expect(JSON.stringify(pass)).not.toContain(privateValue);
  });
  it("erhält explizite Spaltenrechte ohne pauschales anon-SELECT", async () => {
    const checked = await sql(`select bool_and(not has_table_privilege('anon', oid, 'SELECT')) from pg_class where oid in ('public.product_materials'::regclass,'public.product_textile_data'::regclass,'public.product_sustainability'::regclass);`);
    expect(checked.code).toBe(0); expect(checked.output.trim()).toBe("t");
    expect((await f.anon.from("products").select("editor_version")).error).not.toBeNull();
  });
  it("neue Anfragen sehen Produkt-, Detail-, Hersteller- und Dokumentänderungen", async () => {
    for (const result of await Promise.all([
      f.a.client.from("products").update({ name: "N3 neuer Name", description: "N3 neue Beschreibung" }).eq("id", f.a.published.id),
      f.a.client.from("product_textile_data").update({ color: "Grün" }).eq("product_id", f.a.published.id),
      f.a.client.from("manufacturers").update({ company_name: "N3 neue Firma" }).eq("id", f.a.company.id),
      f.a.client.from("documents").update({ name: "N3 neues Dokument" }).eq("id", f.a.publicDoc.id),
    ])) expect(result.error).toBeNull();
    const pass = await getOeffentlicherPass(createPublicClient(), f.a.published.public_id);
    expect(pass?.produkt.name).toBe("N3 neuer Name"); expect(pass?.textildaten?.color).toBe("Grün");
    expect(pass?.hersteller?.company_name).toBe("N3 neue Firma"); expect(pass?.dokumente[0].name).toBe("N3 neues Dokument");
  });
  it("Bild- und Dokumenttoken laufen tatsächlich ab und werden erneut erteilt", async () => {
    const urls = await Promise.all([signed(undefined, 1), signed(f.a.publicDoc.id, 1)]);
    for (const url of urls) expect((await fetch(url, { cache: "no-store" })).ok).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 2200));
    for (const url of urls) expect((await fetch(url, { cache: "no-store" })).ok).toBe(false);
    for (const url of await Promise.all([signed(), signed(f.a.publicDoc.id)])) expect((await fetch(url)).ok).toBe(true);
  });
  it("Rücknahme sperrt frische Erteilungen, alte Tokens bleiben befristet; Wiederveröffentlichung funktioniert", async () => {
    const urls = await Promise.all([signed(), signed(f.a.publicDoc.id)]);
    await status(false);
    try {
      expect(await getOeffentlicherPass(createPublicClient(), f.a.published.public_id)).toBeNull();
      for (const id of [undefined, f.a.publicDoc.id]) expect(await getPublicFile(createPublicClient(), f.a.published.public_id, id)).toEqual({ status: "unavailable" });
      // Expliziter Nachweis der Grenze: RLS-Rücknahme widerruft ausgegebene JWTs nicht.
      for (const url of urls) expect((await fetch(url, { cache: "no-store" })).ok).toBe(true);
    } finally { await status(true); }
    expect(await getOeffentlicherPass(createPublicClient(), f.a.published.public_id)).not.toBeNull();
    expect((await fetch(await signed())).ok).toBe(true);
    expect((await fetch(await signed(f.a.publicDoc.id))).ok).toBe(true);
  });
  it("interne, fremde und gelöschte Dokumente können nicht erneuert werden", async () => {
    for (const id of [f.a.internalDoc.id, f.a.draftDoc.id, f.b.publicDoc.id]) expect(await getPublicFile(createPublicClient(), f.a.published.public_id, id)).toEqual({ status: "unavailable" });
    expect((await f.a.client.from("documents").update({ visibility: "intern" }).eq("id", f.a.publicDoc.id)).error).toBeNull();
    expect(await getPublicFile(createPublicClient(), f.a.published.public_id, f.a.publicDoc.id)).toEqual({ status: "unavailable" });
    expect((await getOeffentlicherPass(createPublicClient(), f.a.published.public_id))?.dokumente).toEqual([]);
    expect((await f.a.client.from("documents").delete().eq("id", f.a.publicDoc.id)).error).toBeNull();
    expect(await getPublicFile(createPublicClient(), f.a.published.public_id, f.a.publicDoc.id)).toEqual({ status: "unavailable" });
  });
  it("stabiler Bildpfad liefert nach Tausch die neue Datei; Entfernung sperrt ihn", async () => {
    const oldSource = (await getOeffentlicherPass(createPublicClient(), f.a.published.public_id))?.produkt.image_url;
    const oldUrl = await signed(); const old = await (await fetch(oldUrl)).arrayBuffer();
    const current = await image(images[0]);
    expect((await getOeffentlicherPass(createPublicClient(), f.a.published.public_id))?.produkt.image_url).not.toBe(oldSource);
    const next = await (await fetch(await signed())).arrayBuffer();
    expect(Buffer.from(old).equals(Buffer.from(next))).toBe(false);
    expect((await fetch(oldUrl, { cache: "no-store" })).ok).toBe(false);
    expect((await f.a.client.rpc("set_product_image", { p_product_id: f.a.published.id, p_expected_path: current, p_new_path: null! })).error).toBeNull();
    expect(await getPublicFile(createPublicClient(), f.a.published.public_id)).toEqual({ status: "unavailable" });
    expect((await getOeffentlicherPass(createPublicClient(), f.a.published.public_id))?.produkt.image_url).toBeNull();
  });
});
