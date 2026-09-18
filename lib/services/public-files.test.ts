import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { getPublicFile, publicFileResponse } from "./public-files";
import { getOeffentlicherPass } from "./products";

const publicId = "7Kf3mQ9xT2Wp";
const productId = "550e8400-e29b-41d4-a716-446655440000";
const documentId = "550e8400-e29b-41d4-a716-446655440001";
function client(options: { failure?: string; published?: boolean; path?: string | null; document?: boolean } = {}) {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const table = url.pathname.split("/").pop()!;
    if (options.failure === table || (options.failure === "storage" && url.pathname.includes("/storage/"))) {
      return Response.json({ message: "Interner Datenbankfehler mit Geheimnis" }, { status: 503 });
    }
    const path = options.path === undefined ? `${productId}/bild.png` : options.path;
    if (url.pathname.includes("/storage/")) return Response.json({ signedURL: "/object/sign/bucket/file?token=test" });
    if (table === "products") return Response.json({ id: productId, public_id: publicId, status: options.published === false ? "entwurf" : "veroeffentlicht", name: "Shirt", description: "Text", category: "Textil", manufacturer_id: productId, image_url: path });
    if (table === "manufacturers") return Response.json({ company_name: "Firma", country: "DE", website: null });
    if (table === "product_materials") return Response.json([]);
    return Response.json(null);
  });
  // Dokumentabfrage liefert bei maybeSingle ein Array (SDK wandelt es um).
  const fetchWithDocuments = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    void init; // Der Spy erfasst den Signierungsbody für die TTL-Prüfung.
    const url = new URL(String(input));
    if (url.pathname.endsWith("/documents") && options.failure !== "documents") {
      const path = options.path === undefined ? `${productId}/datei.pdf` : options.path;
      return Response.json(options.document === false ? [] : [{ id: documentId, name: "Datei", doc_type: "PDF", file_path: path }]);
    }
    return fetcher(input);
  });
  return { db: createClient<Database>("http://127.0.0.1:1", "test-anon", {
    auth: { persistSession: false, autoRefreshToken: false }, db: { retry: false }, global: { fetch: fetchWithDocuments },
  }), fetch: fetchWithDocuments };
}

describe("öffentliche Dateierteilung", () => {
  it("verwirft ungültige IDs vor einem Datenzugriff", async () => {
    const c = client();
    expect(await getPublicFile(c.db, "../intern")).toEqual({ status: "unavailable" });
    expect(await getPublicFile(c.db, publicId, "../pfad")).toEqual({ status: "unavailable" });
    expect(c.fetch).not.toHaveBeenCalled();
  });
  it.each([{ published: false }, { path: null }, { path: "fremdes-produkt/bild.png" }])("signiert keinen verbotenen Bildbezug: %j", async (options) => {
    const c = client(options);
    expect(await getPublicFile(c.db, publicId)).toEqual({ status: "unavailable" });
    expect(c.fetch.mock.calls.some(([url]) => String(url).includes("/storage/"))).toBe(false);
  });
  it("bindet Dokument-ID an Produkt und öffentliche Sichtbarkeit; signiert für 300 Sekunden", async () => {
    const c = client();
    expect((await getPublicFile(c.db, publicId, documentId)).status).toBe("available");
    const query = new URL(String(c.fetch.mock.calls.find(([url]) => String(url).includes("/documents"))![0]));
    expect(query.searchParams.get("id")).toBe(`eq.${documentId}`);
    expect(query.searchParams.get("product_id")).toBe(`eq.${productId}`);
    expect(query.searchParams.get("visibility")).toBe("eq.oeffentlich");
    const sign = c.fetch.mock.calls.find(([url]) => String(url).includes("/storage/"))!;
    expect(JSON.parse(String(sign[1]?.body)).expiresIn).toBe(300);
  });
  it("unbekanntes Dokument bleibt gesperrt", async () => {
    expect(await getPublicFile(client({ document: false }).db, publicId, documentId)).toEqual({ status: "unavailable" });
  });
  it.each(["products", "documents", "storage"])("behandelt %s-Ausfall als temporären Fehler", async (failure) => {
    expect(await getPublicFile(client({ failure }).db, publicId, documentId)).toEqual({ status: "error" });
  });
  it.each(["products", "manufacturers", "product_materials", "product_textile_data", "product_sustainability", "documents"])("liefert bei %s-DB-Fehler keinen unvollständigen Pass", async (failure) => {
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
