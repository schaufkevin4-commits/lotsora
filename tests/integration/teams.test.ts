import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createFixtures, pdfBytes, type Fixtures } from "./fixtures";
import { completeDocumentUpload } from "@/lib/services/upload-completion";
import { bereinigeDatei } from "@/lib/services/file-cleanup";
import { sql } from "./sql";

describe("Firmenteams", () => {
  let f: Fixtures;
  beforeEach(async () => { f = await createFixtures(); });
  afterEach(async () => { await f?.cleanup(); });

  async function invite(email: string, client = f.a.client) {
    const result = await client.rpc("create_company_invitation", { p_email: email });
    expect(result.error).toBeNull();
    return result.data![0];
  }
  async function join() {
    const member = await f.invitedUser();
    const invitation = await invite(member.email);
    expect((await member.client.rpc("accept_company_invitation", { p_token: invitation.token })).error).toBeNull();
    return { member, invitation };
  }

  test("bestehende Firmen haben einen Verantwortlichen; Metadaten vergeben keine Rechte", async () => {
    const members = await f.a.client.rpc("list_company_members");
    expect(members.data).toEqual([expect.objectContaining({ user_id: f.a.userId, role: "owner" })]);
    const pending = await f.invitedUser();
    expect((await pending.client.from("manufacturers").select()).data).toEqual([]);
    expect((await pending.client.from("products").select()).data).toEqual([]);
    expect((await pending.client.auth.updateUser({ data: { manufacturer_id: f.a.company.id, role: "owner" } })).error).toBeNull();
    expect((await pending.client.rpc("create_company_invitation", { p_email: "other@example.invalid" })).error?.code).toBe("42501");
    expect((await pending.client.from("manufacturer_memberships").insert({ manufacturer_id: f.a.company.id, user_id: pending.userId })).error?.code).toBe("42501");
  });

  test("zwei Mitglieder teilen Produkte und Dokumente, fremde Firmen bleiben getrennt", async () => {
    const { member } = await join();
    expect((await member.client.from("manufacturers").select()).data?.map(m => m.id)).toEqual([f.a.company.id]);
    expect((await member.client.from("products").select("id")).data?.map(p => p.id).sort()).toEqual([f.a.published.id, f.a.draft.id].sort());
    expect((await member.client.from("documents").select("id").eq("id", f.a.internalDoc.id)).data).toHaveLength(1);
    expect((await member.client.storage.from("produkt-dokumente").download(f.a.internalDoc.file_path!)).error).toBeNull();
    expect((await member.client.from("products").update({ name: "Gemeinsam bearbeitet" }).eq("id", f.a.draft.id)).error).toBeNull();
    expect((await f.a.client.from("products").select("name").eq("id", f.a.draft.id).single()).data?.name).toBe("Gemeinsam bearbeitet");
    expect((await member.client.from("products").update({ name: "Fremde Änderung" }).eq("id", f.b.draft.id).select()).data).toEqual([]);
    expect((await member.client.rpc("reserve_file_upload", { p_product_id: f.b.draft.id, p_file_name: "test.pdf", p_purpose: "document" })).error?.code).toBe("42501");
    expect((await member.client.storage.from("produkt-dokumente").download(f.b.internalDoc.file_path!)).error).not.toBeNull();
    expect((await member.client.from("manufacturers").update({ company_name: "Unberechtigt" }).eq("id", f.a.company.id).select()).data).toEqual([]);
    expect((await member.client.from("manufacturers").update({ user_id: member.userId }).eq("id", f.a.company.id)).error?.code).toBe("42501");
    expect((await member.client.rpc("create_company_invitation", { p_email: "other@example.invalid" })).error?.code).toBe("42501");
    expect((await member.client.rpc("remove_company_member", { p_user_id: f.a.userId })).error?.code).toBe("42501");
    expect((await member.client.rpc("transfer_company_ownership", { p_user_id: member.userId })).error?.code).toBe("42501");
    expect((await member.client.from("company_invitations").select("id,email")).data).toEqual([]);
    expect((await f.b.client.rpc("list_company_members")).data).toHaveLength(1);
    expect((await f.anon.rpc("list_company_members")).error).not.toBeNull();
    expect((await f.a.client.from("company_invitations").select("token_hash")).error?.code).toBe("42501");
  });

  test("Einladungen verlangen passende bestätigte Mail und sind widerrufbar/zeitlich begrenzt", async () => {
    const target = await f.invitedUser();
    const wrong = await f.invitedUser();
    const first = await invite(target.email.toUpperCase());
    expect((await wrong.client.rpc("accept_company_invitation", { p_token: first.token })).error?.code).toBe("42501");
    expect((await f.b.client.rpc("revoke_company_invitation", { p_invitation_id: first.invitation_id })).error).not.toBeNull();
    // Direkte Auth-Tabelle nur für den Testzustand unbestätigter E-Mail.
    expect((await sql(`update auth.users set email_confirmed_at=null where id='${target.userId}';`)).code).toBe(0);
    expect((await target.client.rpc("accept_company_invitation", { p_token: first.token })).error?.code).toBe("42501");
    expect((await sql(`update auth.users set email_confirmed_at=now() where id='${target.userId}';`)).code).toBe(0);
    const second = await invite(target.email);
    expect((await target.client.rpc("accept_company_invitation", { p_token: first.token })).error?.code).toBe("22023");
    expect((await f.a.client.rpc("revoke_company_invitation", { p_invitation_id: second.invitation_id })).error).toBeNull();
    expect((await target.client.rpc("accept_company_invitation", { p_token: second.token })).error?.code).toBe("22023");
    const third = await invite(target.email);
    expect((await f.verifier.from("company_invitations").update({ expires_at: "2000-01-01T00:00:00Z" }).eq("id", third.invitation_id)).error).toBeNull();
    expect((await target.client.rpc("accept_company_invitation", { p_token: third.token })).error?.code).toBe("22023");
    expect((await f.anon.rpc("accept_company_invitation", { p_token: third.token })).error).not.toBeNull();
  });

  test("zwei Benutzer können speichern und veröffentlichen, veraltete und entzogene Saves scheitern", async () => {
    const { member } = await join();
    const product = (await member.client.from("products").select().eq("id", f.a.draft.id).single()).data!;
    const args = {
      p_product_id: product.id, p_expected_version: product.editor_version, p_expected_status: "entwurf" as const,
      p_name: "Gemeinsam gespeichert", p_description: "Teamprodukt", p_category: "Textil", p_brand: "", p_article_number: "TEAM-001",
      p_materials: [{ material_name: "Baumwolle", percentage: 100 }], p_textile_data: { color: "Blau" }, p_sustainability: {},
    };
    const results = await Promise.all([
      f.a.client.rpc("save_product_checked", args), member.client.rpc("save_product_checked", args),
    ]);
    expect(results.filter(result => !result.error)).toHaveLength(1);
    expect(results.find(result => result.error)?.error?.code).toBe("40001");
    const version = results.find(result => !result.error)!.data!;
    const published = await member.client.rpc("set_product_publication_checked", {
      p_product_id: product.id, p_expected_version: version, p_publish: true,
    });
    expect(published.error).toBeNull();
    expect((await f.a.client.rpc("remove_company_member", { p_user_id: member.userId })).error).toBeNull();
    expect((await member.client.rpc("save_product_checked", { ...args, p_expected_version: published.data!, p_expected_status: "veroeffentlicht" })).error?.code).toBe("42501");
    expect((await member.client.rpc("set_product_publication_checked", { p_product_id: product.id, p_expected_version: published.data!, p_publish: false })).error?.code).toBe("42501");
    expect((await f.a.client.from("products").select("name,status").eq("id", product.id).single()).data).toEqual({ name: "Gemeinsam gespeichert", status: "veroeffentlicht" });
  });

  test("gleichzeitiger Beitritt ist einmalig und ein Konto kann nur einer Firma angehören", async () => {
    const target = await f.invitedUser();
    const a = await invite(target.email);
    const b = await invite(target.email, f.b.client);
    const results = await Promise.all([
      target.client.rpc("accept_company_invitation", { p_token: a.token }),
      target.client.rpc("accept_company_invitation", { p_token: b.token }),
    ]);
    expect(results.filter(r => !r.error)).toHaveLength(1);
    expect(results.find(r => r.error)?.error?.code).toBe("23514");
    const winner = results[0].error ? b : a;
    expect((await target.client.rpc("accept_company_invitation", { p_token: winner.token })).error).toBeNull();
    expect((await target.client.from("manufacturer_memberships").select().eq("user_id", target.userId)).data).toHaveLength(1);
    const existing = await invite(f.b.email);
    expect((await f.b.client.rpc("accept_company_invitation", { p_token: existing.token })).error?.code).toBe("23514");
  });

  test("Entfernen sperrt die vorhandene Sitzung; verbrauchter Link gewährt keinen neuen Zutritt", async () => {
    const { member, invitation } = await join();
    const sessionBefore = (await member.client.auth.getSession()).data.session!.access_token;
    expect((await f.a.client.rpc("remove_company_member", { p_user_id: member.userId })).error).toBeNull();
    expect((await member.client.auth.getSession()).data.session!.access_token).toBe(sessionBefore);
    expect((await member.client.from("products").select()).data).toEqual([]);
    expect((await member.client.from("file_operations").select()).data).toEqual([]);
    expect((await member.client.storage.from("produkt-dokumente").download(f.a.internalDoc.file_path!)).error).not.toBeNull();
    expect((await member.client.from("products").update({ name: "Nach Entzug" }).eq("id", f.a.draft.id).select()).data).toEqual([]);
    expect((await member.client.rpc("accept_company_invitation", { p_token: invitation.token })).error?.code).toBe("22023");
    const reinvite = await invite(member.email);
    expect((await member.client.rpc("accept_company_invitation", { p_token: reinvite.token })).error).toBeNull();
  });

  test("Dateiabschluss und Aufräumen funktionieren teamweit nach Entfernung des Uploaders", async () => {
    const { member } = await join();
    const reserved = await member.client.rpc("reserve_file_upload", { p_product_id: f.a.draft.id, p_file_name: "team.pdf", p_purpose: "document" });
    expect(reserved.error).toBeNull();
    const operation = reserved.data!;
    expect(operation.owner_id).toBe(member.userId);
    expect(operation.manufacturer_id).toBe(f.a.company.id);
    try {
      expect((await member.client.storage.from("produkt-dokumente").upload(operation.file_path, await pdfBytes(), { contentType: "application/pdf" })).error).toBeNull();
      expect((await f.a.client.rpc("remove_company_member", { p_user_id: member.userId })).error).toBeNull();
      expect((await member.client.rpc("begin_file_validation", { p_operation_id: operation.id })).error?.code).toBe("42501");
      expect((await f.verifier.rpc("mark_file_validated", { p_operation_id: operation.id, p_owner_id: member.userId })).error?.code).toBe("42501");
      const doc = await completeDocumentUpload(f.a.client, f.verifier, operation.id, { name: "Team-Dokument", docType: "Datenblatt", description: null });
      expect(doc.product_id).toBe(f.a.draft.id);
      expect((await f.a.client.from("products").delete().eq("id", f.a.draft.id)).error).toBeNull();
      expect((await bereinigeDatei(f.a.client, operation.id)).complete).toBe(true);
      expect((await member.client.rpc("begin_file_cleanup", { p_operation_id: operation.id })).error?.code).toBe("42501");
    } finally {
      await f.verifier.storage.from("produkt-dokumente").remove([operation.file_path]);
    }
  });

  test("Verantwortung bleibt erhalten; Übergabe entzieht Verwaltungsrechte und widerruft Einladungen", async () => {
    const { member } = await join();
    const pending = await f.invitedUser();
    const invitation = await invite(pending.email);
    expect((await f.a.client.rpc("remove_company_member", { p_user_id: f.a.userId })).error?.code).toBe("42501");
    expect((await f.verifier.auth.admin.deleteUser(f.a.userId)).error).not.toBeNull();
    expect((await f.a.client.from("products").select("id")).data).toHaveLength(2);
    expect((await f.a.client.rpc("transfer_company_ownership", { p_user_id: f.b.userId })).error?.code).toBe("22023");
    expect((await f.a.client.rpc("transfer_company_ownership", { p_user_id: member.userId })).error).toBeNull();
    expect((await f.a.client.rpc("create_company_invitation", { p_email: pending.email })).error?.code).toBe("42501");
    expect((await pending.client.rpc("accept_company_invitation", { p_token: invitation.token })).error?.code).toBe("22023");
    expect((await member.client.from("manufacturers").update({ company_name: "Firma mit neuem Verantwortlichen" }).eq("id", f.a.company.id)).error).toBeNull();
    expect((await member.client.rpc("transfer_company_ownership", { p_user_id: f.a.userId })).error).toBeNull();
    // Löschen eines Mitarbeiters darf gemeinsame Produkte nicht kaskadierend löschen.
    expect((await f.verifier.auth.admin.deleteUser(member.userId)).error).toBeNull();
    expect((await f.a.client.from("products").select("id")).data).toHaveLength(2);
  });
});
