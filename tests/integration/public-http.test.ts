import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, request as httpRequest, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { createFixtures, testConfig, type Fixtures } from "./fixtures";
import { completeImageUpload } from "@/lib/services/upload-completion";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";

// Separater Produktionsbuild: node scripts/integration.mjs http.
// Der Proxy zählt echte SDK-Requests und injiziert Ausfälle, keine Cache-Mocks.
describe.skipIf(process.env.LOTSORA_TEST_HTTP !== "1")("N3 im echten Next-Produktionsserver", () => {
  let f: Fixtures; let proxy: Server; let server: ChildProcess;
  const requests: string[] = [];
  let failTable = "";
  let stall = false;
  let heldRead: { ready: () => void; release: Promise<void> } | undefined;
  let imagePath: string | undefined;
  const readyPath = resolve(".local-tests/n3-browser-ready.json");
  const stopPath = resolve(".local-tests/n3-browser-stop");
  const faultPath = resolve(".local-tests/n3-browser-fault");
  const base = "http://127.0.0.1:3108";
  beforeAll(async () => {
    testConfig();
    f = await createFixtures();
    for (const result of await Promise.all([
      f.a.client.from("product_textile_data").insert({ product_id: f.a.published.id, color: "N3-Blau", wash_instructions: "N3-Waschen" }),
      f.a.client.from("product_sustainability").insert({ product_id: f.a.published.id, reusable_materials: "N3-Wiederverwenden" }),
    ])) if (result.error) throw result.error;
    const reserved = await f.a.client.rpc("reserve_file_upload", { p_product_id: f.a.published.id, p_file_name: "n3-http.png", p_purpose: "image" });
    if (reserved.error) throw reserved.error;
    imagePath = reserved.data.file_path;
    const png = await sharp({ create: { width: 128, height: 128, channels: 3, background: "#175f68" } }).png().toBuffer();
    const uploaded = await f.a.client.storage.from(DOKUMENTE_BUCKET).upload(imagePath, png, { contentType: "image/png" });
    if (uploaded.error) throw uploaded.error;
    await completeImageUpload(f.a.client, f.verifier, reserved.data.id, null);
    if (process.env.LOTSORA_TEST_HTTP_BROWSER === "1") {
      for (const path of [readyPath, stopPath, faultPath]) rmSync(path, { force: true });
    }
    proxy = createServer((incoming, outgoing) => {
      const path = incoming.url ?? "/";
      requests.push(`${incoming.method} ${path}`);
      if (stall && path.startsWith("/rest/v1/products?")) {
        const timer = setTimeout(() => { outgoing.writeHead(503); outgoing.end(); }, 15000);
        outgoing.on("close", () => clearTimeout(timer)); return;
      }
      const browserFault = process.env.LOTSORA_TEST_HTTP_BROWSER === "1" && existsSync(faultPath)
        ? readFileSync(faultPath, "utf8").trim() : "";
      if (browserFault === "storage" && path.startsWith("/storage/")) {
        outgoing.writeHead(503); outgoing.end(); return;
      }
      if ((failTable && path.startsWith(`/rest/v1/${failTable}?`)) ||
        (browserFault === "products" && path.startsWith("/rest/v1/products?"))) {
        outgoing.writeHead(503, { "Content-Type": "application/json", "Retry-After": "0" });
        outgoing.end(JSON.stringify({ message: "N3-INTERNER-DB-FEHLER" })); return;
      }
      const upstream = httpRequest(`${testConfig().url}${path}`, {
        method: incoming.method, headers: { ...incoming.headers, host: "127.0.0.1:55321" },
      }, response => {
        const hold = heldRead;
        if (hold && path.startsWith("/rest/v1/products?") && new URL(path, base).searchParams.get("select")?.includes(",name,")) {
          const chunks: Buffer[] = [];
          response.on("data", chunk => chunks.push(Buffer.from(chunk)));
          response.on("end", async () => {
            hold.ready(); await hold.release;
            outgoing.writeHead(response.statusCode ?? 502, response.headers);
            outgoing.end(Buffer.concat(chunks));
          }); return;
        }
        outgoing.writeHead(response.statusCode ?? 502, response.headers); response.pipe(outgoing);
      });
      upstream.on("error", () => { outgoing.writeHead(503); outgoing.end(); });
      incoming.pipe(upstream);
    });
    await new Promise<void>((done, reject) => { proxy.once("error", reject); proxy.listen(55329, "127.0.0.1", done); });
    server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3108"], {
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, windowsHide: true, stdio: "pipe",
    });
    // Entleeren ohne Schlüssel/URLs aus Serverlogs in Testausgaben zu spiegeln.
    server.stdout?.resume(); server.stderr?.resume();
    const start = Date.now();
    while (true) {
      try { if ((await fetch(`${base}/p/ungueltig`)).ok) break; } catch { /* Server startet. */ }
      if (server.exitCode !== null || Date.now() - start > 20000) throw new Error("Lokaler Next-Testserver nicht gestartet.");
      await new Promise(done => setTimeout(done, 100));
    }
  }, 60000);
  afterAll(async () => {
    if (process.env.LOTSORA_TEST_HTTP_BROWSER === "1" && f && server?.exitCode === null) {
      writeFileSync(readyPath, JSON.stringify({ url: `${base}/p/${f.a.published.public_id}`, documentUrl: `${base}/p/${f.a.published.public_id}/dokumente/${f.a.publicDoc.id}` }));
      const deadline = Date.now() + 10 * 60_000;
      while (!existsSync(stopPath) && Date.now() < deadline) await new Promise(done => setTimeout(done, 250));
      for (const path of [readyPath, stopPath, faultPath]) rmSync(path, { force: true });
    }
    if (server && server.exitCode === null) {
      const closed = new Promise<void>(done => server.once("exit", () => done()));
      server.kill(); await closed;
    }
    if (proxy) { proxy.closeAllConnections(); await new Promise<void>(done => proxy.close(() => done())); }
    if (f && imagePath) await f.a.client.storage.from(DOKUMENTE_BUCKET).remove([imagePath]);
    await f?.cleanup();
  }, 660000);
  async function page(cookie = "") {
    const response = await fetch(`${base}/p/${f.a.published.public_id}`, { headers: cookie ? { Cookie: cookie } : {} });
    return { response, html: await response.text() };
  }
  it("proxy schützt interne Routen; angemeldete Hersteller erreichen nur ihre Produkte", async () => {
    for (const path of ["/dashboard", "/profil", `/produkte/${f.a.published.id}`]) {
      const response = await fetch(`${base}${path}`, { redirect: "manual" });
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!, base).pathname).toBe("/login");
    }
    for (const owner of [f.a, f.b]) {
      const headers = { Cookie: owner.cookies().map(c => `${c.name}=${c.value}`).join("; ") };
      const own = await fetch(`${base}/produkte/${owner.published.id}`, { headers, redirect: "manual" });
      expect(own.status).toBe(200);
      expect(await own.text()).toContain("Produkt bearbeiten");
      const other = owner === f.a ? f.b : f.a;
      const foreign = await fetch(`${base}/produkte/${other.published.id}`, { headers });
      const html = await foreign.text();
      expect(html).toContain("Produkt nicht gefunden");
      expect(html).not.toContain(`value="${other.published.name}"`);
    }
  });
  it("teilt Seite/Metadaten: sieben relationale Reads, keine Signierung; Folgeanfrage liest frisch", async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      requests.length = 0;
      const { response, html } = await page();
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(html).toContain(`<title>${f.a.published.name} – Produktpass | lotsora</title>`);
      expect(html).toContain(f.a.published.description);
      expect(requests.filter(x => x.startsWith("GET /rest/v1/"))).toHaveLength(7);
      expect(requests.filter(x => x.includes("/storage/"))).toHaveLength(0);
    }
  });
  it("A/B/anon sehen dieselben erlaubten vollständigen Inhalte und Metadaten", async () => {
    let expectedMain: string | undefined;
    for (const cookies of [[], f.a.cookies(), f.b.cookies()]) {
      const { html } = await page(cookies.map(c => `${c.name}=${c.value}`).join("; "));
      const main = html.match(/<main>[\s\S]*?<\/main>/)?.[0];
      expect(main).toBeDefined();
      if (expectedMain === undefined) expectedMain = main;
      else expect(main).toBe(expectedMain);
      for (const value of [f.a.published.name, "N3-Blau", "N3-Waschen", "N3-Wiederverwenden", f.a.publicDoc.name, "Testfirma A"]) expect(html).toContain(value);
      for (const value of ["Interne Testnotiz", "INTERN-001", f.a.internalDoc.name, "editor_version", "contact_person"]) expect(html).not.toContain(value);
    }
  });
  it("frische Seite und Metadaten nach Änderung, Rücknahme und Wiederveröffentlichung", async () => {
    expect((await f.a.client.from("products").update({ name: "HTTP-Neuer-Name", description: "HTTP-Neue-Beschreibung" }).eq("id", f.a.published.id)).error).toBeNull();
    let content = await page();
    expect(content.html).toContain("<title>HTTP-Neuer-Name – Produktpass | lotsora</title>");
    expect(content.html).toContain('content="HTTP-Neue-Beschreibung"');
    expect((await f.a.client.rpc("withdraw_product", { p_product_id: f.a.published.id })).error).toBeNull();
    try {
      content = await page(); expect(content.html).toContain("Produktpass nicht verfügbar");
      expect(content.html).not.toContain("HTTP-Neuer-Name");
    } finally { expect((await f.a.client.rpc("publish_product", { p_product_id: f.a.published.id })).error).toBeNull(); }
    expect((await page()).html).toContain("HTTP-Neuer-Name");
  });
  it("alte Seitenlinks prüfen beim Öffnen erneut; Redirects und Fehler sind no-store", async () => {
    const url = `${base}/p/${f.a.published.public_id}/dokumente/${f.a.publicDoc.id}`;
    let response = await fetch(url, { redirect: "manual" });
    expect(response.status).toBe(307); expect(response.headers.get("cache-control")).toContain("no-store");
    expect((await fetch(response.headers.get("location")!)).ok).toBe(true);
    expect((await f.a.client.from("documents").update({ visibility: "intern" }).eq("id", f.a.publicDoc.id)).error).toBeNull();
    try {
      response = await fetch(url, { redirect: "manual" }); expect(response.status).toBe(404);
      expect(response.headers.get("location")).toBeNull();
    } finally { expect((await f.a.client.from("documents").update({ visibility: "oeffentlich" }).eq("id", f.a.publicDoc.id)).error).toBeNull(); }
    expect((await fetch(url, { redirect: "manual" })).status).toBe(307);
  });
  it("DB-Ausfall ist weder Nichtexistenz noch stiller Teilpass; Metadaten neutral und Wiederholung erfolgreich", async () => {
    for (const table of ["products", "product_materials", "manufacturers", "documents"]) {
      failTable = table;
      try {
        const { html } = await page();
        expect(html).toContain("Produktpass konnte nicht geladen werden");
        expect(html).toContain("Erneut versuchen");
        expect(html).not.toContain("HTTP-Neuer-Name"); expect(html).not.toContain("N3-INTERNER-DB-FEHLER");
      } finally { failTable = ""; }
      expect((await page()).html).toContain("HTTP-Neuer-Name");
    }
  });
  it("hängende Abfrage endet begrenzt ohne automatische DB-Wiederholung", async () => {
    requests.length = 0; stall = true;
    const start = Date.now();
    try {
      expect((await page()).html).toContain("Produktpass konnte nicht geladen werden");
      expect(Date.now() - start).toBeLessThan(12000);
      expect(requests.filter(x => x.startsWith("GET /rest/v1/products?"))).toHaveLength(1);
    } finally { stall = false; }
    expect((await page()).html).toContain("HTTP-Neuer-Name");
  });
  it("dokumentiert laufende Lesung bei Rücknahme; nächste Anfrage ist sicher gesperrt", async () => {
    let ready!: () => void; let release!: () => void;
    const read = new Promise<void>(done => { ready = done; });
    heldRead = { ready, release: new Promise<void>(done => { release = done; }) };
    const pending = page();
    try {
      await read;
      expect((await f.a.client.rpc("withdraw_product", { p_product_id: f.a.published.id })).error).toBeNull();
      release();
      const { html } = await pending;
      // Keine Snapshot-Zusage: die vor Rücknahme gelesenen Basisdaten können
      // diesen bereits gestarteten Request noch abschließen.
      expect(html).toContain("<title>HTTP-Neuer-Name – Produktpass | lotsora</title>");
      expect(html).toContain("HTTP-Neue-Beschreibung");
      heldRead = undefined;
      expect((await page()).html).not.toContain("HTTP-Neuer-Name");
    } finally {
      release(); heldRead = undefined;
      await pending;
      expect((await f.a.client.rpc("publish_product", { p_product_id: f.a.published.id })).error).toBeNull();
    }
  });
});
