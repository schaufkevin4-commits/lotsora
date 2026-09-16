import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import { DOKUMENTE_BUCKET, setzeDokumentSichtbarkeit } from "@/lib/services/documents";
import { ladeDokumentHoch } from "@/lib/services/upload-completion";
import { PDFDocument } from "pdf-lib";

export async function pdfBytes() {
  const pdf = await PDFDocument.create(); pdf.addPage([100, 100]);
  return new Uint8Array(await pdf.save());
}

export type TestCookie = { name: string; value: string };

export function testConfig() {
  const url = process.env.LOTSORA_TEST_URL;
  const anonKey = process.env.LOTSORA_TEST_ANON_KEY;
  const serviceKey = process.env.LOTSORA_TEST_SERVICE_KEY;
  // Kein Fallback auf .env.local, Cloud oder den normalen Entwicklungsport.
  if (url !== "http://127.0.0.1:55321" || !anonKey || !serviceKey) {
    throw new Error("Nur die isolierte Instanz auf 127.0.0.1:55321 ist für diese Tests erlaubt.");
  }
  return { url, anonKey, serviceKey };
}

export async function createFixtures() {
  const { url, anonKey, serviceKey } = testConfig();
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient<Database>(url, serviceKey, options);
  const anon = createClient<Database>(url, anonKey, options);
  const users: string[] = [];
  const files: { client: SupabaseClient<Database>; path: string }[] = [];

  async function cleanup() {
    const errors: string[] = [];
    for (const file of files) {
      const { error } = await file.client.storage.from(DOKUMENTE_BUCKET).remove([file.path]);
      if (error) errors.push(`Testdatei konnte nicht gelöscht werden: ${error.message}`);
    }
    // Admin nur für Kontenaufbau/-abbau; sämtliche Fach-/Zugriffsprüfungen mit A/B/anon.
    for (const id of users) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) errors.push(`Testkonto konnte nicht gelöscht werden: ${error.message}`);
    }
    if (users.length) {
      const { error } = await admin.from("file_operations").delete().in("owner_id", users);
      if (error) errors.push(`Test-Dateivorgänge konnten nicht entfernt werden: ${error.message}`);
    }
    if (errors.length) throw new Error(errors.join("\n"));
  }

  async function manufacturer(label: string) {
    const email = `lotsora-test-${randomUUID()}@example.invalid`;
    const password = `Test-${randomUUID()}!`;
    const { data: account, error: accountError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (accountError) throw accountError;
    users.push(account.user.id);
    let cookies: TestCookie[] = [];
    const client = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll: () => cookies,
        setAll: (updates) => {
          const values = new Map(cookies.map((cookie) => [cookie.name, cookie.value]));
          for (const cookie of updates) values.set(cookie.name, cookie.value);
          cookies = [...values].map(([name, value]) => ({ name, value }));
        },
      },
    });
    const { error: loginError } = await client.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    const { data: company, error: companyError } = await client.from("manufacturers")
      .update({ company_name: `Testfirma ${label}`, country: "DE", contact_person: "Intern" })
      .eq("user_id", account.user.id).select().single();
    if (companyError) throw companyError;
    const companyId = company.id;

    async function product(status: "entwurf" | "veroeffentlicht") {
      const { data, error } = await client.from("products").insert({
        manufacturer_id: companyId, name: `Test-Shirt ${label} ${status}`,
        description: "Synthetische Testdaten", category: "T-Shirt", status,
        article_number: "INTERN-001",
      }).select().single();
      if (error) throw error;
      const { error: materialError } = await client.from("product_materials").insert({
        product_id: data.id, material_name: "Baumwolle", percentage: 100,
      });
      if (materialError) throw materialError;
      return data;
    }

    const published = await product("veroeffentlicht");
    const draft = await product("entwurf");
    async function document(productId: string, visibility: "intern" | "oeffentlich") {
      const content = await pdfBytes();
      const doc = await ladeDokumentHoch(client, productId,
        new File([content], "test.pdf", { type: "application/pdf" }),
        { name: `Dokument ${label} ${visibility}`, docType: "Datenblatt", description: "Interne Testnotiz" }, admin);
      files.push({ client, path: doc.file_path! });
      return visibility === "oeffentlich"
        ? setzeDokumentSichtbarkeit(client, doc.id, visibility)
        : doc;
    }
    const internalDoc = await document(published.id, "intern");
    const publicDoc = await document(published.id, "oeffentlich");
    const draftDoc = await document(draft.id, "oeffentlich");
    return { client, company, published, draft, internalDoc, publicDoc, draftDoc, cookies: () => cookies };
  }

  try {
    const a = await manufacturer("A");
    const b = await manufacturer("B");
    return { a, b, anon, verifier: admin, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export type Fixtures = Awaited<ReturnType<typeof createFixtures>>;
