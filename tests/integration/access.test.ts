import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getOeffentlicherPass, getProdukt, getVorschauPass } from "@/lib/services/products";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";
import { createFixtures, testConfig, type Fixtures, type TestCookie } from "./fixtures";

const visitor = vi.hoisted(() => ({ cookies: [] as TestCookie[] }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => visitor.cookies, set: () => {} }),
}));
vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(),
  connection: async () => {},
}));

let fixture: Fixtures;
beforeAll(async () => {
  fixture = await createFixtures();
  const config = testConfig();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", config.url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", config.anonKey);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await fixture?.cleanup();
});

describe("Echte Mandantentrennung auf lotsora-integration", () => {
  it("Auth-Trigger und zwei getrennte Eigentümersessions funktionieren", async () => {
    expect(fixture.a.company.id).not.toBe(fixture.b.company.id);
    expect(await getProdukt(fixture.a.client, fixture.a.draft.id)).not.toBeNull();
    expect(await getProdukt(fixture.b.client, fixture.a.draft.id)).toBeNull();
    expect(await getVorschauPass(fixture.b.client, fixture.a.published.id)).toBeNull();
    const changed = await fixture.b.client.from("products").update({ name: "Fremdänderung" })
      .eq("id", fixture.a.published.id).select("id");
    expect(changed.error).toBeNull();
    expect(changed.data).toEqual([]);
  });

  it("anon sieht den veröffentlichten Pass, keine Entwürfe und keine internen Spalten", async () => {
    const pass = await getOeffentlicherPass(fixture.anon, fixture.a.published.public_id);
    expect(pass?.produkt.name).toBe(fixture.a.published.name);
    expect(pass?.dokumente.map((doc) => doc.id)).toEqual([fixture.a.publicDoc.id]);
    expect(await getOeffentlicherPass(fixture.anon, fixture.a.draft.public_id)).toBeNull();
    expect(await getOeffentlicherPass(fixture.anon, fixture.a.published.id)).toBeNull();
    const privateFields = await fixture.anon.from("products").select("article_number");
    expect(privateFields.error).not.toBeNull();
    const contacts = await fixture.anon.from("manufacturers").select("contact_person");
    expect(contacts.error).not.toBeNull();
    const write = await fixture.anon.from("products").update({ name: "Anon" })
      .eq("id", fixture.a.published.id);
    expect(write.error).not.toBeNull();
  });

  it("Storage gibt ausschließlich freigegebene Dateien veröffentlichter Produkte aus", async () => {
    for (const doc of [fixture.a.internalDoc, fixture.a.draftDoc]) {
      const result = await fixture.anon.storage.from(DOKUMENTE_BUCKET).createSignedUrl(doc.file_path!, 60);
      expect(result.error).not.toBeNull();
    }
    const foreign = await fixture.b.client.storage.from(DOKUMENTE_BUCKET)
      .download(fixture.a.internalDoc.file_path!);
    expect(foreign.error).not.toBeNull();
    const publicFile = await fixture.anon.storage.from(DOKUMENTE_BUCKET)
      .download(fixture.a.publicDoc.file_path!);
    expect(publicFile.error).toBeNull();
    expect((await publicFile.data?.text())?.startsWith("%PDF-")).toBe(true);
  });

  it("öffentliche Route liefert Seite und Metadaten unabhängig von A/B/anon-Cookies (F02)", async () => {
    const { generateMetadata, default: page } = await import("@/app/p/[id]/page");
    for (const cookies of [[], fixture.a.cookies(), fixture.b.cookies()]) {
      visitor.cookies = cookies;
      const metadata = await generateMetadata({ params: Promise.resolve({ id: fixture.a.published.public_id }) });
      expect(metadata.title).toBe(`${fixture.a.published.name} – Produktpass`);
      const rendered = await page({ params: Promise.resolve({ id: fixture.a.published.public_id }) });
      const pass = rendered.props.children.props.pass;
      expect(pass.produkt.name).toBe(fixture.a.published.name);
      expect(Object.keys(pass.dokumente[0]).sort()).toEqual(["doc_type", "id", "name", "url"]);
      expect(Object.keys(pass.materialien[0]).sort()).toEqual(["id", "material_name", "percentage"]);
      expect(pass.dokumente[0].url).toBe(`/p/${fixture.a.published.public_id}/dokumente/${fixture.a.publicDoc.id}`);
    }
  });

  it("interne Dokumentnotizen sind auch über die anonyme API nicht lesbar", async () => {
    const result = await fixture.anon.from("documents").select("description")
      .eq("id", fixture.a.publicDoc.id);
    expect(result.error).not.toBeNull();
    const own = await fixture.a.client.from("documents").select("description")
      .eq("id", fixture.a.publicDoc.id).single();
    expect(own.error).toBeNull();
    expect(own.data?.description).toBe("Interne Testnotiz");
  });

  it("blockiert fremde, falsche und fehlende Dateiverweise bei Insert und Update", async () => {
    const invalidPaths = [
      fixture.b.internalDoc.file_path!,
      fixture.a.draftDoc.file_path!,
      `${fixture.a.published.id}/fehlt.pdf`,
      `${fixture.a.published.id}/unterordner/datei.pdf`,
      "keine-produkt-id/datei.pdf",
      "",
    ];
    for (const file_path of invalidPaths) {
      const inserted = await fixture.a.client.from("documents").insert({
        product_id: fixture.a.published.id, name: "Ungültiger Testpfad", file_path,
      });
      expect(inserted.error, file_path).not.toBeNull();
      const updated = await fixture.a.client.from("documents").update({ file_path })
        .eq("id", fixture.a.publicDoc.id);
      expect(updated.error, file_path).not.toBeNull();
    }
    const reparent = await fixture.a.client.from("documents").update({ product_id: fixture.a.draft.id })
      .eq("id", fixture.a.publicDoc.id);
    expect(reparent.error).not.toBeNull();
    const unchanged = await fixture.a.client.from("documents").select("file_path, product_id")
      .eq("id", fixture.a.publicDoc.id).single();
    expect(unchanged.data).toEqual({ file_path: fixture.a.publicDoc.file_path, product_id: fixture.a.published.id });
  });

  it("Rücknahme sperrt neue öffentliche Pass- und Dateiabrufe", async () => {
    const { error } = await fixture.a.client.from("products").update({ status: "entwurf" })
      .eq("id", fixture.a.published.id);
    expect(error).toBeNull();
    try {
      expect(await getOeffentlicherPass(fixture.anon, fixture.a.published.public_id)).toBeNull();
      const file = await fixture.anon.storage.from(DOKUMENTE_BUCKET).download(fixture.a.publicDoc.file_path!);
      expect(file.error).not.toBeNull();
    } finally {
      const restored = await fixture.a.client.from("products").update({ status: "veroeffentlicht" })
        .eq("id", fixture.a.published.id);
      if (restored.error) throw restored.error;
    }
  });

  it("fremde interne Dateipfade lassen sich nicht als eigene öffentliche Dokumente eintragen (F01)", async () => {
    const injected = await fixture.a.client.from("documents").insert({
      product_id: fixture.a.published.id, name: "Manipulierter Testverweis",
      file_path: fixture.b.internalDoc.file_path, visibility: "oeffentlich",
    }).select("id").maybeSingle();
    try {
      const leak = await fixture.anon.storage.from(DOKUMENTE_BUCKET).download(fixture.b.internalDoc.file_path!);
      expect(leak.error, "Fremde interne Datei muss unlesbar bleiben").not.toBeNull();
      expect(injected.error, "Ungültige Dateizuordnung muss bereits beim Schreiben scheitern").not.toBeNull();
    } finally {
      if (injected.data) {
        const removed = await fixture.a.client.from("documents").delete().eq("id", injected.data.id);
        if (removed.error) throw removed.error;
      }
    }
  });
});
