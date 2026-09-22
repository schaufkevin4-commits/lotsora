import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import { DOKUMENTE_BUCKET, setzeDokumentSichtbarkeit } from "@/lib/services/documents";
import { ladeDokumentHoch } from "@/lib/services/upload-completion";
import { PDFDocument } from "pdf-lib";
import { sql } from "./sql";
import { saveFixtureProduct, publishFixtureProduct } from "./product-write";

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
  const companies: string[] = [];
  const files: { client: SupabaseClient<Database>; path: string }[] = [];

  async function cleanup() {
    const errors: string[] = [];
    for (const file of files) {
      // Nur erfasste Testdateien; Rollenwechsel in Tests/Demo können dem
      // ursprünglichen Kontoinhaber inzwischen die Aufräumrechte entziehen.
      const { error } = await admin.storage.from(DOKUMENTE_BUCKET).remove([file.path]);
      if (error) errors.push(`Testdatei konnte nicht gelöscht werden: ${error.message}`);
    }
    // Firmen bewusst vor Konten abbauen: ein Verantwortlicher darf nicht
    // versehentlich mitsamt gemeinsamem Firmenbestand gelöscht werden.
    // P2-2 kann mit vorhandenen Testkonten neue Firmen anlegen. Auch bei einer
    // fehlgeschlagenen Assertion diese ausschließlich fixture-eigenen Firmen erfassen.
    if (users.length) {
      if (users.some(id => !/^[a-f0-9-]{36}$/.test(id))) throw new Error("Ungültige Testkonto-ID.");
      // Auch SELECT ist für service_role hier absichtlich nicht freigegeben.
      const owned = await sql(`select id from public.manufacturers where user_id in (${users.map(id => `'${id}'`).join(",")});`);
      if (owned.code !== 0) errors.push("Neu angelegte Testfirmen konnten nicht ermittelt werden.");
      for (const id of owned.output.trim().split(/\s+/).filter(Boolean)) {
        if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Ungültige Testfirmen-ID.");
        if (!companies.includes(id)) companies.push(id);
      }
    }
    if (companies.length) {
      if (companies.some(id => !/^[a-f0-9-]{36}$/.test(id))) throw new Error("Ungültige Testfirmen-ID.");
      // service_role erhält keine zusätzlichen Firmen-Löschrechte nur für Tests.
      const result = await sql(`delete from public.manufacturers where id in (${companies.map(id => `'${id}'`).join(",")});`);
      if (result.code !== 0) errors.push(`Testfirmen konnten nicht gelöscht werden: ${result.output}`);
    }
    // Admin nur für Kontenaufbau/-abbau; sämtliche Fach-/Zugriffsprüfungen mit A/B/anon.
    for (const id of users) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error && error.status !== 404) errors.push(`Testkonto konnte nicht gelöscht werden: ${error.message}`);
    }
    if (users.length) {
      const { error } = await admin.from("file_operations").delete().in("owner_id", users);
      if (error) errors.push(`Test-Dateivorgänge konnten nicht entfernt werden: ${error.message}`);
    }
    if (companies.length) {
      const result = await admin.from("file_operations").delete().in("manufacturer_id", companies);
      if (result.error) errors.push("Test-Dateivorgänge mit entferntem Akteur konnten nicht entfernt werden.");
      const jobs = await admin.from("deletion_jobs").delete().in("company_id", companies);
      if (jobs.error) errors.push("Test-Firmenlöschaufträge konnten nicht entfernt werden.");
    }
    // Persönliche Testaufträge können nach Auth-Löschung bereits anonymisiert sein.
    // Neue Tests entfernen ihre bekannten Job-IDs zusätzlich im eigenen finally.
    if (users.length) await admin.from("deletion_jobs").delete().in("actor_id", users);
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
    companies.push(companyId);

    async function product(status: "entwurf" | "veroeffentlicht") {
      const { data, error } = await client.from("products").insert({
        manufacturer_id: companyId, name: `Test-Shirt ${label} ${status}`,
        description: "Synthetische Testdaten", category: "T-Shirt", status: "entwurf",
        article_number: "INTERN-001",
      }).select().single();
      if (error) throw error;
      const { error: materialError } = await saveFixtureProduct(client, data.id, {
        p_materials: [{ material_name: "Baumwolle", percentage: 100 }],
      });
      if (materialError) throw materialError;
      const refreshed = await client.from("products").select().eq("id", data.id).single();
      if (refreshed.error) throw refreshed.error;
      return refreshed.data;
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
    const released=await publishFixtureProduct(client,published.id,true);
    if(released.error) throw released.error;
    const currentPublished=(await client.from("products").select().eq("id",published.id).single()).data!;
    return { client, company, email, password, userId: account.user.id, published:currentPublished, draft, internalDoc, publicDoc, draftDoc, cookies: () => cookies };
  }

  async function invitedUser() {
    const email = `lotsora-team-${randomUUID()}@example.invalid`;
    const password = `Test-${randomUUID()}!`;
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { join_team: true },
    });
    if (error) throw error;
    users.push(data.user.id);
    let cookies: TestCookie[] = [];
    const client = createServerClient<Database>(url, anonKey, {
      cookies: { getAll: () => cookies, setAll: (updates) => {
        const values = new Map(cookies.map(c => [c.name, c.value]));
        for (const cookie of updates) values.set(cookie.name, cookie.value);
        cookies = [...values].map(([name, value]) => ({ name, value }));
      } },
    });
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    return { client, email, password, userId: data.user.id, cookies: () => cookies };
  }

  function sessionWithCookies(initial: TestCookie[] = []) {
    let cookies = initial;
    const client = createServerClient<Database>(url, anonKey, {
      cookies: { getAll: () => cookies, setAll: (updates) => {
        const values = new Map(cookies.map(c => [c.name, c.value]));
        for (const cookie of updates) values.set(cookie.name, cookie.value);
        cookies = [...values].map(([name, value]) => ({ name, value }));
      } },
    });
    return { client, cookies: () => cookies };
  }

  async function pendingUser(redirectTo: string, joinTeam = true, requestedEmail?: string) {
    const email = requestedEmail ?? `lotsora-auth-${randomUUID()}@example.invalid`;
    if (!/^lotsora-[a-z-]+-[0-9a-f-]+@example\.invalid$/.test(email)) throw new Error("Nur synthetische Adressen erlaubt.");
    const password = `Test-${randomUUID()}!`;
    const session = sessionWithCookies();
    const signup = await session.client.auth.signUp({ email, password, options: {
      emailRedirectTo: redirectTo,
      data: joinTeam ? { join_team: true } : { company_name: "Auth-Testfirma" },
    } });
    if (signup.error) throw signup.error;
    if (!signup.data.user) throw new Error("Testregistrierung lieferte kein Konto.");
    const userId = signup.data.user.id;
    users.push(userId);
    if (!joinTeam) {
      const company = await sql(`select id from public.manufacturers where user_id='${userId}';`);
      const id = company.output.trim();
      if (company.code !== 0 || !/^[a-f0-9-]{36}$/.test(id)) throw new Error("Testfirma fehlt.");
      companies.push(id);
    }
    if (signup.data.session) throw new Error("Testkonfiguration muss eine echte E-Mail-Bestätigung verlangen.");
    return { ...session, email, password, userId };
  }

  try {
    const a = await manufacturer("A");
    const b = await manufacturer("B");
    return { a, b, anon, verifier: admin, invitedUser, pendingUser, sessionWithCookies, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export type Fixtures = Awaited<ReturnType<typeof createFixtures>>;
