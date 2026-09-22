import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { getPublicFile, publicFileResponse } from "./public-files";
import { getOeffentlicherPass } from "./products";

const publicId = "7Kf3mQ9xT2Wp";
const productId = "550e8400-e29b-41d4-a716-446655440000";
const documentId = "550e8400-e29b-41d4-a716-446655440001";
function client(options: { failure?: string; published?: boolean; path?: string | null; document?: boolean } = {}) {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const table = url.pathname.split("/").pop()!;
    if (options.failure === table || (options.failure === "storage" && url.pathname.includes("/storage/"))) {
      return Response.json({ message: "Interner Datenbankfehler mit Geheimnis" }, { status: 503 });
    }
    const path = options.path === undefined ? `${productId}/bild.png` : options.path;
    if (url.pathname.includes("/storage/")) return Response.json({ signedURL: "/object/sign/bucket/file?token=test" });
    if (table === "get_published_file_path") {
      const args = JSON.parse(String(init?.body));
      return Response.json(options.published === false || (args.p_document_id && options.document === false) ? null : path);
    }
    if (table === "get_published_product_pass") return Response.json(options.published === false ? null : {
      produkt: { public_id: publicId, name: "Shirt", image_url: `/p/${publicId}/bild` },
      hersteller: { company_name: "Firma", country: "DE", website: null }, materialien: [],
      dokumente: [{ id: documentId, name: "Datei", doc_type: "PDF", url: `/p/${publicId}/dokumente/${documentId}` }],
    });
    return Response.json(null);
  });
  return { db: createClient<Database>("http://127.0.0.1:1", "test-anon", {
    auth: { persistSession: false, autoRefreshToken: false }, db: { retry: false }, global: { fetch: fetcher },
  }), fetch: fetcher };
}

describe("öffentliche Dateierteilung", () => {
  it("verwirft ungültige IDs vor einem Datenzugriff", async () => {
    const c = client();
    expect(await getPublicFile(c.db, "../intern")).toEqual({ status: "unavailable" });
    expect(await getPublicFile(c.db, publicId, "../pfad")).toEqual({ status: "unavailable" });
    expect(c.fetch).not.toHaveBeenCalled();
  });
  it.each([{ published: false }, { path: null }])("signiert keinen unveröffentlichten Bildbezug: %j", async (options) => {
    const c = client(options);
    expect(await getPublicFile(c.db, publicId)).toEqual({ status: "unavailable" });
    expect(c.fetch.mock.calls.some(([url]) => String(url).includes("/storage/"))).toBe(false);
  });
  it("bindet Dokument-ID an Produkt und öffentliche Sichtbarkeit; signiert für 300 Sekunden", async () => {
    const c = client();
    expect((await getPublicFile(c.db, publicId, documentId)).status).toBe("available");
    const query = c.fetch.mock.calls.find(([url]) => String(url).includes("/rpc/get_published_file_path"))!;
    expect(JSON.parse(String(query[1]?.body))).toEqual({ p_public_id: publicId, p_document_id: documentId });
    const sign = c.fetch.mock.calls.find(([url]) => String(url).includes("/storage/"))!;
    expect(JSON.parse(String(sign[1]?.body)).expiresIn).toBe(300);
  });
  it("unbekanntes Dokument bleibt gesperrt", async () => {
    expect(await getPublicFile(client({ document: false }).db, publicId, documentId)).toEqual({ status: "unavailable" });
  });
  it.each(["get_published_file_path", "storage"])("behandelt %s-Ausfall als temporären Fehler", async (failure) => {
    expect(await getPublicFile(client({ failure }).db, publicId, documentId)).toEqual({ status: "error" });
  });
  it.each(["get_published_product_pass"])("liefert bei %s-DB-Fehler keinen unvollständigen Pass", async (failure) => {
    await expect(getOeffentlicherPass(client({ failure }).db, publicId)).rejects.toBeDefined();
  });
  it("lädt den Textpass ohne Signierungsaufrufe und ohne Storage-Abhängigkeit", async () => {
    const c = client({ failure: "storage" });
    const pass = await getOeffentlicherPass(c.db, publicId);
    expect(pass?.produkt.image_url).toBe(`/p/${publicId}/bild`);
    expect(pass?.dokumente[0].url).toBe(`/p/${publicId}/dokumente/${documentId}`);
    expect(c.fetch.mock.calls.some(([url]) => String(url).includes("/storage/"))).toBe(false);
  });
  it("Redirect, Fehler und Nichtverfügbarkeit sind nicht cachebar; keine internen Details", async () => {
    for (const [result, status] of [
      [{ status: "available", url: "https://example.invalid/datei" }, 307],
      [{ status: "unavailable" }, 404], [{ status: "error" }, 503],
    ] as const) {
      const response = publicFileResponse(result);
      expect(response.status).toBe(status);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      expect(await response.text()).not.toContain("Geheimnis");
    }
  });
});
