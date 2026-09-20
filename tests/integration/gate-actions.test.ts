import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createFixtures, testConfig, type Fixtures, type TestCookie } from "./fixtures";
import { teamAktion } from "@/app/(intern)/team/actions";
import { einladungAktion } from "@/app/einladung/[token]/actions";
import { produktLoeschen, produktSpeichern } from "@/app/(intern)/produkte/[id]/actions";
import { dokumentLoeschen } from "@/app/(intern)/produkte/[id]/dokument-actions";
import { registrieren, passwortResetAnfordern } from "@/app/(auth)/actions";
import { deleteProdukt } from "@/lib/services/products";
import { loescheDokument } from "@/lib/services/documents";
import { sql } from "./sql";
import { profilSpeichern } from "@/app/(intern)/profil/actions";

// Nur Next-Requestkontext und Cache werden ersetzt. Auth, RLS, RPCs und
// Fachservices laufen echt gegen die isolierte Datenbank und Storage-API.
const visitor = vi.hoisted(() => ({ cookies: [] as TestCookie[] }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => visitor.cookies,
  set: (name: string, value: string) => {
    visitor.cookies = [...visitor.cookies.filter(c => c.name !== name), { name, value }];
  },
}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let f: Fixtures;
const initial = { ok: false, error: null };
it("Profil normalisiert Websites, schützt gespeicherte Daten bei Fehlern und verweigert Mitarbeitern Änderungen", async () => {
  const saved = await profilSpeichern(initial, form({ company_name: "Profil-Testfirma", country: "AT", website: "www.example.com" }));
  expect(saved).toMatchObject({ ok: true, website: "https://www.example.com/" });
  const before = await f.a.client.from("manufacturers").select("company_name,country,website").eq("id", f.a.company.id).single();
  expect(before.data).toEqual({ company_name: "Profil-Testfirma", country: "AT", website: "https://www.example.com/" });
  const invalid = await profilSpeichern(initial, form({ company_name: "Nicht speichern", website: "javascript:alert(1)" }));
  expect(invalid.ok).toBe(false);
  expect(invalid.error).toContain("gültige Website");
  const member = await joinMember();
  visitor.cookies = member.cookies();
  const denied = await profilSpeichern(initial, form({ company_name: "Nicht erlaubt", website: "https://example.org" }));
  expect(denied.ok).toBe(false);
  const after = await f.a.client.from("manufacturers").select("company_name,country,website").eq("id", f.a.company.id).single();
  expect(after.data).toEqual(before.data);
});
beforeAll(async () => {
  f = await createFixtures();
  const config = testConfig();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", config.url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", config.anonKey);
});
beforeEach(() => {
  visitor.cookies = f.a.cookies();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3109/");
  vi.clearAllMocks();
});
afterAll(async () => { vi.unstubAllEnvs(); await f?.cleanup(); });

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}
async function invite(email: string) {
  const result = await teamAktion({}, form({ intent: "invite", email }));
  expect(result.error).toBeUndefined();
  const url = new URL(result.invitationUrl!);
  expect(url.origin).toBe("http://127.0.0.1:3109");
  expect(url.pathname).toMatch(/^\/einladung\/[a-f0-9]{64}$/);
  const row = await f.a.client.from("company_invitations").select("id,revoked_at").eq("email", email).is("revoked_at", null).single();
  expect(row.error).toBeNull();
  return { id: row.data!.id, token: url.pathname.split("/").at(-1)! };
}
async function joinMember() {
  const member = await f.invitedUser();
  const invitation = await invite(member.email);
  visitor.cookies = member.cookies();
  await expect(einladungAktion(invitation.token, {}, form({ intent: "accept" }))).rejects.toMatchObject({
    digest: "NEXT_REDIRECT;replace;/team;307;",
  });
  visitor.cookies = f.a.cookies();
  return member;
}

describe("Gate: echte Server Actions der Teamkette", () => {
  it("Einladungs-Action gibt einen nutzbaren Link zurück; Mitarbeiter darf nicht einladen", async () => {
    const member = await joinMember();
    visitor.cookies = member.cookies();
    const denied = await teamAktion({}, form({ intent: "invite", email: "nicht-erlaubt@example.invalid" }));
    expect(denied.error).toContain("Nur Firmenverantwortliche");
    expect(denied.invitationUrl).toBeUndefined();
    expect((await f.a.client.from("company_invitations").select("id").eq("email", "nicht-erlaubt@example.invalid")).data).toEqual([]);
  });

  it("fehlerhafte Website-Adresse erhält den alten Einladungslink ohne neuen DB-Eintrag", async () => {
    const member = await f.invitedUser();
    const old = await invite(member.email);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    const result = await teamAktion({}, form({ intent: "invite", email: member.email }));
    expect(result.error).toContain("Website-Adresse");
    expect(result.invitationUrl).toBeUndefined();
    const rows = await f.a.client.from("company_invitations").select("id,revoked_at").eq("email", member.email);
    expect(rows.error).toBeNull();
    expect(rows.data).toEqual([{ id: old.id, revoked_at: null }]);
    expect((await member.client.rpc("accept_company_invitation", { p_token: old.token })).error).toBeNull();
  });

  it("Widerruf verlangt Bestätigung; Wiederholung verändert den Zeitstempel nicht", async () => {
    const member = await f.invitedUser();
    const invitation = await invite(member.email);
    const values = { intent: "revoke", id: invitation.id };
    expect((await teamAktion({}, form(values))).error).toContain("bestätigen");
    expect((await f.a.client.from("company_invitations").select("revoked_at").eq("id", invitation.id).single()).data?.revoked_at).toBeNull();
    expect((await teamAktion({}, form({ ...values, confirmed: "yes" }))).message).toBe("Einladung widerrufen.");
    const revoked = (await f.a.client.from("company_invitations").select("revoked_at").eq("id", invitation.id).single()).data!.revoked_at;
    expect(revoked).not.toBeNull();
    expect((await teamAktion({}, form({ ...values, confirmed: "yes" }))).error).toBeDefined();
    expect((await f.a.client.from("company_invitations").select("revoked_at").eq("id", invitation.id).single()).data?.revoked_at).toBe(revoked);
    expect((await member.client.rpc("accept_company_invitation", { p_token: invitation.token })).error?.code).toBe("22023");
  });

  it("Entfernen prüft IDs und entzieht einem gültigen Mitglied die bestehende Sitzung", async () => {
    const member = await joinMember();
    expect((await teamAktion({}, form({ intent: "remove", id: "ungueltig", confirmed: "yes" }))).error).toBe("Ungültiger Eintrag.");
    expect((await member.client.from("products").select("id")).data?.length).toBeGreaterThan(0);
    expect((await teamAktion({}, form({ intent: "remove", id: member.userId, confirmed: "yes" }))).message).toContain("Teammitglied entfernt");
    expect((await member.client.from("products").select("id")).data).toEqual([]);
  });

  it("Übergabe über die Action entzieht dem alten Inhaber die Verwaltungsrechte", async () => {
    const member = await joinMember();
    try {
      expect((await teamAktion({}, form({ intent: "transfer", id: member.userId, confirmed: "yes" }))).message).toContain("Firmenverantwortung übergeben");
      expect((await teamAktion({}, form({ intent: "invite", email: "nach-uebergabe@example.invalid" }))).error).toContain("Nur Firmenverantwortliche");
      visitor.cookies = member.cookies();
      expect((await teamAktion({}, form({ intent: "invite", email: "neuer-inhaber@example.invalid" }))).invitationUrl).toBeDefined();
    } finally {
      visitor.cookies = member.cookies();
      expect((await teamAktion({}, form({ intent: "transfer", id: f.a.userId, confirmed: "yes" }))).error).toBeUndefined();
      visitor.cookies = f.a.cookies();
    }
  });

  it("Beitritts-Action lehnt das falsche Konto ab und leitet das richtige nach erfolgreichem Beitritt weiter", async () => {
    const target = await f.invitedUser();
    const wrong = await f.invitedUser();
    const invitation = await invite(target.email);
    visitor.cookies = wrong.cookies();
    const denied = await einladungAktion(invitation.token, {}, form({ intent: "accept" }));
    expect(denied.error).toContain("E-Mail");
    expect((await wrong.client.from("manufacturer_memberships").select("user_id")).data).toEqual([]);
    visitor.cookies = target.cookies();
    await expect(einladungAktion(invitation.token, {}, form({ intent: "accept" }))).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/team;307;" });
    expect((await target.client.from("manufacturer_memberships").select("manufacturer_id").eq("user_id", target.userId)).data).toEqual([{ manufacturer_id: f.a.company.id }]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("veraltete Speicherversion liefert Konflikt ohne Formularänderung oder Überschreiben", async () => {
    const current = await f.a.client.from("products").select("editor_version").eq("id", f.a.draft.id).single();
    expect(current.error).toBeNull();
    const version = current.data!.editor_version;
    const fields = { name: "Neuer bestätigter Stand", description: "Beschreibung", category: "Textil", material_name: "Baumwolle", material_pct: "100", color: "Blau" };
    const saved = await produktSpeichern(f.a.draft.id, version, form(fields));
    expect(saved.ok).toBe(true);
    const stale = form({ ...fields, name: "Meine ungespeicherten Eingaben", color: "Rot" });
    const before = [...stale.entries()];
    vi.clearAllMocks();
    const result = await produktSpeichern(f.a.draft.id, version, stale);
    expect(result).toMatchObject({ ok: false, conflict: true });
    expect(result.error).toContain("Eingaben bleiben");
    expect([...stale.entries()]).toEqual(before);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect((await f.a.client.from("products").select("name,editor_version").eq("id", f.a.draft.id).single()).data).toEqual({ name: fields.name, editor_version: saved.version });
    expect((await f.a.client.from("product_textile_data").select("color").eq("product_id", f.a.draft.id).single()).data?.color).toBe("Blau");
  });

  it("Produktlöschung meldet fremde und fehlende Ziele im Service und in der Action", async () => {
    for (const id of [f.b.draft.id, randomUUID()]) {
      await expect(deleteProdukt(f.a.client, id)).rejects.toThrow("Produkt nicht gefunden oder kein Zugriff.");
      expect(await produktLoeschen(id, initial, new FormData())).toEqual({ ok: false, error: "Produkt nicht gefunden oder kein Zugriff." });
    }
    expect(revalidatePath).not.toHaveBeenCalled();
    expect((await f.b.client.from("products").select("id").eq("id", f.b.draft.id)).data).toHaveLength(1);
  });

  it("Dokumentlöschung meldet fremde und fehlende Ziele im Service und in der Action", async () => {
    for (const id of [f.b.internalDoc.id, randomUUID()]) {
      await expect(loescheDokument(f.a.client, id)).rejects.toThrow("Dokument nicht gefunden oder kein Zugriff.");
      expect(await dokumentLoeschen(id, f.b.published.id, initial, new FormData())).toEqual({ ok: false, error: "Dokument nicht gefunden oder kein Zugriff." });
    }
    expect(revalidatePath).not.toHaveBeenCalled();
    expect((await f.b.client.from("documents").select("id").eq("id", f.b.internalDoc.id)).data).toHaveLength(1);
  });

  it("alle drei Auth-Mail-Actions melden eine fehlende Website-Adresse verständlich", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    const fields = form({ email: f.a.email, password: "Testpasswort", company_name: "Testfirma" });
    expect((await registrieren({ error: null }, fields)).error).toContain("Website-Adresse");
    expect(await passwortResetAnfordern({ error: null, sent: false }, fields)).toMatchObject({ sent: false, error: expect.stringContaining("Website-Adresse") });
    expect((await einladungAktion("a".repeat(64), {}, form({ intent: "signup", email: f.a.email, password: "Testpasswort" }))).error).toContain("Website-Adresse");
  });

  it("die drei alten permissiven Policies sind im migrierten Katalog entfernt", async () => {
    const result = await sql("select count(*) from pg_policies where (schemaname='storage' and tablename='objects' and policyname='Dok-Datei: eigene loeschen') or (schemaname='public' and tablename='manufacturers' and policyname in ('Hersteller legt eigene Firma an','Hersteller loescht eigene Firma'));");
    expect(result.code).toBe(0);
    expect(result.output.trim()).toBe("0");
  });
});
