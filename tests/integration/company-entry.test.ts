import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createFixtures, testConfig, type Fixtures, type TestCookie } from "./fixtures";
import { asManufacturer, sql, sqlSession } from "./sql";
import { getDeletionPreview } from "@/lib/services/account-deletion";
import { runDeletionJob } from "@/lib/services/deletion-runner";
import { firmaAnlegen } from "@/app/firma/neu/actions";

const visitor = vi.hoisted(() => ({ cookies: [] as TestCookie[] }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => visitor.cookies,
  set: (name: string, value: string) => { visitor.cookies = [...visitor.cookies.filter(c => c.name !== name), { name, value }]; },
}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
let f: Fixtures;
beforeEach(async () => {
  f = await createFixtures();
  const config = testConfig();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", config.url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", config.anonKey);
  visitor.cookies = [];
});
afterEach(async () => { vi.unstubAllEnvs(); await f?.cleanup(); });
const args = (name = "Neue Textilfirma") => ({ p_name: name, p_request_id: randomUUID() });
async function member() {
  const m = await f.invitedUser();
  const invitation = await f.a.client.rpc("create_company_invitation", { p_email: m.email });
  expect(invitation.error).toBeNull();
  expect((await m.client.rpc("accept_company_invitation", { p_token: invitation.data![0].token })).error).toBeNull();
  return m;
}
async function waitingFor(query: string) {
  await vi.waitFor(async () => {
    const locks = await sql(`select count(*) from pg_stat_activity where wait_event_type='Lock' and query ilike '%${query}%' and pid<>pg_backend_pid();`);
    expect(Number(locks.output.trim())).toBeGreaterThan(0);
  }, { timeout: 4000 });
}

it("legt mit demselben bestätigten Konto eine leere Firma atomar an und wiederholt idempotent", async () => {
  const m = await member();
  expect((await f.a.client.rpc("remove_company_member", { p_user_id: m.userId })).error).toBeNull();
  expect((await m.client.rpc("get_company_entry_state")).data).toBe("ready");
  const request = args("  Neue Textilfirma  ");
  const result = await m.client.rpc("create_own_company", request);
  expect(result.error).toBeNull();
  expect((await m.client.rpc("create_own_company", request)).data).toBe(result.data);
  expect((await m.client.from("manufacturers").select("id,user_id,company_name")).data)
    .toEqual([{ id: result.data, user_id: m.userId, company_name: "Neue Textilfirma" }]);
  expect((await m.client.from("products").select("id")).data).toEqual([]);
  expect((await m.client.rpc("get_company_entry_state")).data).toBe("member");
  expect((await m.client.auth.getUser()).data.user?.email).toBe(m.email);
  expect((await f.a.client.from("products").select("id")).data).toHaveLength(2);
  expect((await m.client.rpc("create_own_company", args())).error?.code).toBe("P2201");
  expect((await m.client.rpc("create_own_company", { ...request, p_name: "Geändert" })).error?.code).toBe("P2203");
});

it("verhindert eine zweite Firma für Verantwortliche und Mitarbeiter sowie direkte Inserts", async () => {
  const m = await member();
  for (const client of [f.a.client, m.client]) {
    expect((await client.rpc("create_own_company", args())).error?.code).toBe("P2201");
    expect((await client.rpc("get_company_entry_state")).data).toBe("member");
  }
  const empty = await f.invitedUser();
  expect((await empty.client.from("manufacturers").insert({ user_id: empty.userId, company_name: "Umgehung" })).error).not.toBeNull();
  expect((await empty.client.from("manufacturer_memberships").insert({ user_id: empty.userId, manufacturer_id: f.b.company.id })).error).not.toBeNull();
});

it("verweigert anonymen und unbestätigten Konten Zugriff", async () => {
  expect((await f.anon.rpc("create_own_company", args())).error?.code).toBe("42501");
  expect((await f.anon.rpc("get_company_entry_state")).error?.code).toBe("42501");
  const m = await f.pendingUser("http://127.0.0.1:3109/auth/confirm");
  const result = await sql(`${asManufacturer(m.userId)} select public.get_company_entry_state(); select public.create_own_company('Unbestätigt','${randomUUID()}'); commit;`);
  expect(result.output).toContain("unconfirmed");
  expect(result.output).toContain("42501");
  expect(result.code).not.toBe(0);
});

it("validiert direkte RPC-Eingaben ohne verwaiste Firma", async () => {
  const m = await f.invitedUser();
  for (const name of ["", "   ", "x".repeat(201), "Firma\nTest", "Firma\u007fTest"]) {
    expect((await m.client.rpc("create_own_company", args(name))).error?.code).toBe("22023");
  }
  expect((await m.client.from("manufacturers").select("id")).data).toEqual([]);
  expect((await m.client.rpc("create_own_company", args("Ü".repeat(200)))).error).toBeNull();
});

it("führt die echte Action mit Validierung, Berechtigung und Redirect aus", async () => {
  const form = new FormData();
  form.set("company_name", "Action-Firma"); form.set("request_id", randomUUID());
  expect((await firmaAnlegen({}, form)).error).toContain("bestätigten");
  const m = await f.invitedUser(); visitor.cookies = m.cookies();
  form.set("company_name", " ");
  expect((await firmaAnlegen({}, form)).error).toContain("Firmennamen");
  form.set("company_name", "Action-Firma"); form.set("request_id", "invalid");
  expect((await firmaAnlegen({}, form)).next).toBe("reload");
  form.set("request_id", randomUUID());
  await expect(firmaAnlegen({}, form)).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/dashboard;307;" });
  await expect(firmaAnlegen({}, form)).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/dashboard;307;" });
  form.set("request_id", randomUUID());
  expect((await firmaAnlegen({}, form)).next).toBe("company");
});

it("sperrt laufende Firmenlöschung und vorgemerkte Mitarbeiter; erlaubt erhaltenem Konto danach den Neustart", async () => {
  const m = await member();
  const preview = await getDeletionPreview(f.a.client, f.a.company.id);
  const job = await f.verifier.rpc("start_company_deletion", {
    p_actor_id: f.a.userId, p_company_id: f.a.company.id, p_fingerprint: preview.fingerprint,
    p_delete_members: true, p_delete_self: false,
  });
  expect(job.error).toBeNull();
  for (const client of [f.a.client, m.client]) {
    expect((await client.rpc("get_company_entry_state")).data).toBe("deleting");
    expect((await client.rpc("create_own_company", args())).error?.code).toBe("P2202");
  }
  expect(await runDeletionJob(f.verifier, job.data!)).toEqual({ complete: true, failed: false });
  expect((await f.a.client.rpc("get_company_entry_state")).data).toBe("ready");
  const company = await f.a.client.rpc("create_own_company", args());
  expect(company.error).toBeNull(); expect(company.data).not.toBe(f.a.company.id);
  expect((await f.a.client.from("products").select("id")).data).toEqual([]);
});

it("verhindert erneute Anlage durch einen alten Request nach Firmenlöschung", async () => {
  const m = await f.invitedUser(); const request = args();
  const company = await m.client.rpc("create_own_company", request);
  expect(company.error).toBeNull();
  const removed = await sql(`delete from public.manufacturers where id='${company.data}';`);
  expect(removed.code).toBe(0);
  expect((await m.client.rpc("create_own_company", request)).error?.code).toBe("P2203");
  expect((await m.client.rpc("create_own_company", args())).error).toBeNull();
});

it.each([true, false])("serialisiert gleichzeitige Anfragen ohne doppelte Firma (gleicher Request=%s)", async (same) => {
  const m = await f.invitedUser(); const request = args();
  const results = await Promise.all([
    m.client.rpc("create_own_company", request),
    m.client.rpc("create_own_company", same ? request : args()),
  ]);
  if (same) {
    expect(results.every(r => !r.error)).toBe(true);
    expect(results[0].data).toBe(results[1].data);
  } else {
    expect(results.filter(r => !r.error)).toHaveLength(1);
    expect(results.find(r => r.error)?.error?.code).toBe("P2201");
  }
  expect((await m.client.from("manufacturers").select("id")).data).toHaveLength(1);
});

it.each([true, false])("serialisiert Einladung und Firmenanlage (Einladung zuerst=%s)", async (inviteFirst) => {
  const m = await f.invitedUser();
  const invitation = await f.a.client.rpc("create_company_invitation", { p_email: m.email });
  const token = invitation.data![0].token;
  const session = sqlSession();
  try {
    await session.query(`${asManufacturer(m.userId)} select public.${inviteFirst
      ? `accept_company_invitation('${token}')`
      : `create_own_company('Race-Firma','${randomUUID()}')`};`);
    const pending = Promise.resolve(inviteFirst
      ? m.client.rpc("create_own_company", args())
      : m.client.rpc("accept_company_invitation", { p_token: token }));
    await waitingFor(inviteFirst ? "create_own_company" : "accept_company_invitation");
    session.end("commit;"); expect((await session.done).code).toBe(0);
    expect((await pending).error).not.toBeNull();
    const memberships = await f.verifier.from("manufacturer_memberships").select("manufacturer_id").eq("user_id", m.userId);
    expect(memberships.data).toHaveLength(1);
    if (inviteFirst) expect(memberships.data![0].manufacturer_id).toBe(f.a.company.id);
    else expect(memberships.data![0].manufacturer_id).not.toBe(f.a.company.id);
  } finally { session.end("rollback;"); await session.done; }
});

it.each([true, false])("serialisiert Kontolöschung und Firmenanlage (Löschung zuerst=%s)", async (deleteFirst) => {
  const m = await f.invitedUser();
  const session = sqlSession();
  try {
    await session.query(deleteFirst
      ? `begin; set local role service_role; select public.start_account_deletion('${m.userId}');`
      : `${asManufacturer(m.userId)} select public.create_own_company('Race-Firma','${randomUUID()}');`);
    const pending = Promise.resolve(deleteFirst
      ? m.client.rpc("create_own_company", args())
      : f.verifier.rpc("start_account_deletion", { p_actor_id: m.userId }));
    await waitingFor(deleteFirst ? "create_own_company" : "start_account_deletion");
    session.end("commit;"); expect((await session.done).code).toBe(0);
    expect((await pending).error?.code).toBe(deleteFirst ? "P2202" : "23514");
    expect((await m.client.rpc("get_company_entry_state")).data).toBe(deleteFirst ? "deleting" : "member");
  } finally { session.end("rollback;"); await session.done; }
});

