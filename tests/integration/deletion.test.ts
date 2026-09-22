import { publishFixtureProduct } from "./product-write";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { createFixtures, testConfig, pdfBytes, type Fixtures } from "./fixtures";
import { sql, asManufacturer } from "./sql";
import { DOKUMENTE_BUCKET, loescheDokument } from "@/lib/services/documents";
import { ladeDokumentHoch } from "@/lib/services/upload-completion";
import { deleteProdukt, getOeffentlicherPass } from "@/lib/services/products";
import { bereinigeDatei, bereinigeProduktdateien, getOffeneDateivorgaenge } from "@/lib/services/file-cleanup";

type DB = SupabaseClient<Database>;
let fixture: Fixtures;
beforeAll(async () => { fixture = await createFixtures(); });
afterAll(async () => {
  if (fixture) {
    // Zusätzliche synthetische Produkte samt Dateien über den Fachpfad abbauen.
    const products = await fixture.a.client.from("products").select("id");
    for (const p of products.data ?? []) await deleteProdukt(fixture.a.client, p.id);
    const pending = await fixture.a.client.from("file_operations").select("id").in("state", ["cleanup", "uploading"]);
    for (const f of pending.data ?? []) await bereinigeDatei(fixture.a.client, f.id);
    await fixture.cleanup();
  }
});

async function product() {
  const { data, error } = await fixture.a.client.from("products").insert({
    manufacturer_id: fixture.a.company.id, name: "Löschtest", description: "Synthetisch", category: "Textil", status: "entwurf",
  }).select().single();
  if (error) throw error;
  return data;
}
async function document(productId: string, client = fixture.a.client) {
  return ladeDokumentHoch(client, productId, new File([await pdfBytes()], "loeschtest.pdf", { type: "application/pdf" }), { name: "B3 Dokument", docType: null, description: null }, fixture.verifier);
}
async function operation(path: string) {
  const result = await fixture.a.client.from("file_operations").select().eq("file_path", path).single();
  if (result.error) throw result.error;
  return result.data;
}

// Nur der benannte Transportfehler wird injiziert. Alle anderen Requests
// durchlaufen das echte PostgreSQL/Auth/Storage der isolierten Instanz.
function storageFault(client: DB, mode: "remove" | "remove-empty" | "remove-response-lost" | "upload") {
  return new Proxy(client, { get(target, key) {
    if (key === "storage") return { from: (bucket: string) => {
      const storage = target.storage.from(bucket);
      return new Proxy(storage, { get(object, method) {
        if (method === "remove" && mode.startsWith("remove")) return async (paths: string[]) => {
          if (mode === "remove-response-lost") await object.remove(paths);
          return mode === "remove-empty" ? { data: [], error: null } : { data: null, error: new Error("Synthetischer Storage-Ausfall") };
        };
        if (method === "upload" && mode === "upload") return async () => { throw new Error("Synthetischer Verbindungsabbruch"); };
        const value = Reflect.get(object, method, object);
        return typeof value === "function" ? value.bind(object) : value;
      } });
    } };
    const value = Reflect.get(target, key, target);
    return typeof value === "function" ? value.bind(target) : value;
  } });
}

describe("B3: Dokument- und Produktlöschung mit wiederholbarer Dateibereinigung", () => {
  it("entfernt Datei und Dokument; erneute Löschung meldet fehlendes Ziel", async () => {
    const p = await product(); const d = await document(p.id);
    expect(await loescheDokument(fixture.a.client, d.id)).toEqual({ complete: true });
    expect((await operation(d.file_path!)).state).toBe("deleted");
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).download(d.file_path!)).error).not.toBeNull();
    await expect(loescheDokument(fixture.a.client, d.id)).rejects.toThrow("Dokument nicht gefunden oder kein Zugriff.");
    expect(await bereinigeDatei(fixture.a.client, (await operation(d.file_path!)).id)).toEqual({ complete: true });
  });

  it("erhält bei Storage-Ausfall den Dateibezug nach Dokumentlöschung", async () => {
    const p = await product(); const d = await document(p.id);
    expect(await loescheDokument(storageFault(fixture.a.client, "remove"), d.id)).toEqual({ complete: false });
    const pending = await operation(d.file_path!);
    expect(pending.state).toBe("cleanup"); expect(pending.last_error).toBe("cleanup_failed");
    expect((await fixture.a.client.from("documents").select().eq("id", d.id)).data).toEqual([]);
    expect((await getOffeneDateivorgaenge(fixture.a.client, p.id)).map((f) => f.id)).toContain(pending.id);
    expect(await bereinigeDatei(fixture.a.client, pending.id)).toEqual({ complete: true });
    expect((await operation(d.file_path!)).state).toBe("deleted");
  });

  it("ein leeres Storage-remove-Ergebnis bestätigt keine vorhandene Datei als gelöscht", async () => {
    const p = await product(); const d = await document(p.id);
    expect(await loescheDokument(storageFault(fixture.a.client, "remove-empty"), d.id)).toEqual({ complete: false });
    expect((await operation(d.file_path!)).last_error).toBe("file_still_present");
    expect(await bereinigeDatei(fixture.a.client, (await operation(d.file_path!)).id)).toEqual({ complete: true });
  });

  it.each(["vorher fehlend", "Antwort verloren"])("beendet Löschung bei bereits entfernter Datei: %s", async (mode) => {
    const p = await product(); const d = await document(p.id);
    if (mode === "vorher fehlend") {
      // Absichtliche externe Beschädigung, kein erlaubter Nutzer-Löschweg.
      expect((await fixture.verifier.storage.from(DOKUMENTE_BUCKET).remove([d.file_path!])).error).toBeNull();
      expect(await loescheDokument(fixture.a.client, d.id)).toEqual({ complete: true });
    } else {
      expect(await loescheDokument(storageFault(fixture.a.client, "remove-response-lost"), d.id)).toEqual({ complete: false });
      expect(await bereinigeDatei(fixture.a.client, (await operation(d.file_path!)).id)).toEqual({ complete: true });
    }
  });

  it("Produktlöschung erhält Dateirechte und reservierte öffentliche ID bis zur Bereinigung", async () => {
    const p = await product(); const a = await document(p.id); const b = await document(p.id);
    expect((await publishFixtureProduct(fixture.a.client, p.id, true)).error).toBeNull();
    const reserved = await fixture.a.client.rpc("reserve_document_upload", { p_product_id: p.id, p_file_name: "abbruch.pdf" });
    expect(reserved.error).toBeNull();
    expect(await deleteProdukt(storageFault(fixture.a.client, "remove"), p.id)).toEqual({ complete: false });
    expect(await getOeffentlicherPass(fixture.anon, p.public_id)).toBeNull();
    expect((await getOffeneDateivorgaenge(fixture.a.client, p.id))).toHaveLength(3);
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).download(a.file_path!)).error).toBeNull();
    expect((await fixture.b.client.storage.from(DOKUMENTE_BUCKET).download(a.file_path!)).error).not.toBeNull();
    await expect(deleteProdukt(fixture.a.client, p.id)).rejects.toThrow("Produkt nicht gefunden oder kein Zugriff.");
    expect(await bereinigeProduktdateien(fixture.a.client, p.id)).toEqual({ complete: true });
    for (const path of [a.file_path!, b.file_path!, reserved.data!.file_path]) expect((await operation(path)).state).toBe("deleted");
    const id = await sql(`select count(*) from private.product_public_ids where public_id = '${p.public_id}';`);
    expect(id.output.trim()).toBe("1");
  });

  it("meldet bei begrenzter API-Ergebnisliste verbleibende Produktdateien als offen", async () => {
    const p = await product();
    await document(p.id); await document(p.id);
    const session = await fixture.a.client.auth.getSession();
    const config = testConfig();
    const limited = createClient<Database>(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${session.data.session!.access_token}` },
        fetch: async (input, init) => {
          const url = new URL(String(input));
          if (url.pathname.endsWith("/file_operations") && init?.method === "GET") url.searchParams.set("limit", "1");
          return fetch(url, init);
        },
      },
    });
    expect(await deleteProdukt(limited, p.id)).toEqual({ complete: false });
    expect(await getOffeneDateivorgaenge(fixture.a.client, p.id)).toHaveLength(1);
    expect(await bereinigeProduktdateien(fixture.a.client, p.id)).toEqual({ complete: true });
  });

  it("direkte API- und SQL-Löschung erzeugen dieselben dauerhaften Aufträge", async () => {
    const p = await product(); const d = await document(p.id);
    expect((await fixture.a.client.from("documents").delete().eq("id", d.id)).error).toBeNull();
    expect((await operation(d.file_path!)).state).toBe("cleanup");
    const other = await document(p.id);
    expect((await sql(`${asManufacturer(fixture.a.company.user_id)} delete from public.products where id = '${p.id}'; commit;`)).code).toBe(0);
    expect((await operation(other.file_path!)).state).toBe("cleanup");
    expect(await bereinigeProduktdateien(fixture.a.client, p.id)).toEqual({ complete: true });
  });

  it("ein gemeinsamer Dateiverweis wird erst nach dem letzten Dokument entfernt", async () => {
    const p = await product(); const d = await document(p.id);
    const duplicate = await fixture.a.client.from("documents").insert({ product_id: p.id, file_path: d.file_path, name: "Zweiter Verweis" }).select().single();
    expect(duplicate.error).toBeNull();
    expect(await loescheDokument(fixture.a.client, d.id)).toEqual({ complete: true });
    expect((await operation(d.file_path!)).state).toBe("attached");
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).download(d.file_path!)).error).toBeNull();
    expect(await loescheDokument(fixture.a.client, duplicate.data!.id)).toEqual({ complete: true });
  });

  it.each(["documents", "products"])("DB-Fehler bei %s rollt Löschprotokoll und Metadaten zurück", async (table) => {
    const p = await product(); const d = await document(p.id);
    const trigger = `zz_b3_fail_${randomUUID().replaceAll("-", "")}`;
    const targetId = table === "documents" ? d.id : p.id;
    try {
      expect((await sql(`create function private.${trigger}() returns trigger language plpgsql as $$ begin
        if old.id = '${targetId}'::uuid then raise exception 'B3 Testfehler'; end if; return old; end $$;
        create trigger ${trigger} before delete on public.${table} for each row execute function private.${trigger}();`)).code).toBe(0);
      await expect(table === "documents" ? loescheDokument(fixture.a.client, d.id) : deleteProdukt(fixture.a.client, p.id)).rejects.toBeDefined();
      expect((await operation(d.file_path!)).state).toBe("attached");
      expect((await fixture.a.client.from("documents").select().eq("id", d.id)).data).toHaveLength(1);
      expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).download(d.file_path!)).error).toBeNull();
    } finally {
      expect((await sql(`drop trigger if exists ${trigger} on public.${table}; drop function if exists private.${trigger}();`)).code).toBe(0);
    }
  });
});

describe("B3: Uploadkompensation und Berechtigungen", () => {
  it("verlorene Insert-Antwort löscht kein erfolgreich angehängtes Dokument", async () => {
    const p = await product();
    const config = testConfig();
    const session = await fixture.a.client.auth.getSession();
    let lost = false;
    const client = createClient<Database>(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${session.data.session!.access_token}` },
        fetch: async (input, init) => {
          const result = await fetch(input, init);
          if (!lost && String(input).includes("/rest/v1/rpc/attach_document_upload") && init?.method === "POST" && result.ok) {
            lost = true; throw new Error("Synthetischer Antwortverlust nach Commit");
          }
          return result;
        },
      },
    });
    const d = await document(p.id, client);
    expect(lost).toBe(true);
    expect((await operation(d.file_path!)).state).toBe("attached");
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).download(d.file_path!)).error).toBeNull();
  });

  it("alte unbestätigte Uploads werden nach Navigation wieder auffindbar", async () => {
    const p = await product();
    const reserved = await fixture.a.client.rpc("reserve_document_upload", { p_product_id: p.id, p_file_name: "abgebrochen.pdf" });
    expect(reserved.error).toBeNull();
    expect(await getOffeneDateivorgaenge(fixture.a.client, p.id)).toHaveLength(0);
    expect((await sql(`update public.file_operations set created_at = now() - interval '16 minutes' where id = '${reserved.data!.id}';`)).code).toBe(0);
    expect((await getOffeneDateivorgaenge(fixture.a.client, p.id)).map((f) => f.id)).toEqual([reserved.data!.id]);
    expect(await bereinigeDatei(fixture.a.client, reserved.data!.id)).toEqual({ complete: true });
  });

  it("ein Upload-Transportabbruch verliert seinen reservierten Dateibezug nicht", async () => {
    const p = await product();
    await expect(document(p.id, storageFault(fixture.a.client, "upload"))).rejects.toThrow("bereinigt");
    const result = await fixture.a.client.from("file_operations").select().eq("product_id", p.id);
    expect(result.data).toHaveLength(1); expect(result.data![0].state).toBe("deleted");
  });

  it("Metadatenfehler plus fehlgeschlagene Kompensation bleiben gezielt nachholbar", async () => {
    const p = await product();
    const trigger = `b3_fail_${randomUUID().replaceAll("-", "")}`;
    try {
      expect((await sql(`create function private.${trigger}() returns trigger language plpgsql as $$ begin
        if new.product_id = '${p.id}'::uuid then raise exception 'B3 Metadatenfehler'; end if; return new; end $$;
        create trigger ${trigger} before insert on public.documents for each row execute function private.${trigger}();`)).code).toBe(0);
      await expect(document(p.id, storageFault(fixture.a.client, "remove"))).rejects.toThrow("Dateivorgang bleibt gespeichert");
      const pending = await getOffeneDateivorgaenge(fixture.a.client, p.id);
      expect(pending).toHaveLength(1); expect(pending[0].state).toBe("cleanup");
      expect(await bereinigeDatei(fixture.a.client, pending[0].id)).toEqual({ complete: true });
    } finally {
      expect((await sql(`drop trigger if exists ${trigger} on public.documents; drop function if exists private.${trigger}();`)).code).toBe(0);
    }
  });

  it("nach Abbruch oder Produktlöschung werden verspätete Uploads und Pfadwiederverwendung gesperrt", async () => {
    const p = await product();
    const reserved = await fixture.a.client.rpc("reserve_document_upload", { p_product_id: p.id, p_file_name: "spaet.pdf" });
    expect(reserved.error).toBeNull();
    expect(await bereinigeDatei(fixture.a.client, reserved.data!.id)).toEqual({ complete: true });
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(reserved.data!.file_path, "late")).error).not.toBeNull();
    const second = await fixture.a.client.rpc("reserve_document_upload", { p_product_id: p.id, p_file_name: "spaeter.pdf" });
    expect(second.error).toBeNull();
    await deleteProdukt(fixture.a.client, p.id);
    expect((await fixture.a.client.storage.from(DOKUMENTE_BUCKET).upload(second.data!.file_path, "late")).error).not.toBeNull();
  });

  it("fremde Aufträge, direkte Manipulation und vorgetäuschte Fertigmeldung sind gesperrt", async () => {
    const p = await product(); const d = await document(p.id); const op = await operation(d.file_path!);
    expect((await fixture.a.client.rpc("begin_file_cleanup", { p_operation_id: op.id })).error?.code).toBe("23514");
    await loescheDokument(storageFault(fixture.a.client, "remove"), d.id);
    expect((await fixture.a.client.rpc("finish_file_cleanup", { p_operation_id: op.id })).data).toBe(false);
    for (const client of [fixture.b.client, fixture.anon]) {
      for (const method of ["begin_file_cleanup", "finish_file_cleanup"] as const) expect((await client.rpc(method, { p_operation_id: op.id })).error?.code).toBe("42501");
      expect((await client.rpc("reserve_document_upload", { p_product_id: p.id, p_file_name: "fremd.pdf" })).error?.code).toBe("42501");
      const read = await client.from("file_operations").select().eq("id", op.id);
      expect(read.data ?? []).toEqual([]);
    }
    expect((await fixture.a.client.from("file_operations").update({ state: "deleted" }).eq("id", op.id)).error?.code).toBe("42501");
    expect((await fixture.a.client.from("file_operations").delete().eq("id", op.id)).error?.code).toBe("42501");
    expect((await fixture.a.client.from("documents").insert({ product_id: p.id, name: "Wiederanhängen", file_path: d.file_path })).error?.code).toBe("23514");
    expect(await bereinigeDatei(fixture.a.client, op.id)).toEqual({ complete: true });
  });
});
