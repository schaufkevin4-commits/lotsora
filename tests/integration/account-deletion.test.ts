import { fixtureSaveArgs, saveFixtureProduct } from "./product-write";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { createFixtures, testConfig, type Fixtures, type TestCookie } from "./fixtures";
import { getDeletionPreview } from "@/lib/services/account-deletion";
import { runDeletionJob } from "@/lib/services/deletion-runner";
import * as deletionRunner from "@/lib/services/deletion-runner";
import { getOeffentlicherPass } from "@/lib/services/products";
import { getPublicFile } from "@/lib/services/public-files";
import { deletionAction } from "@/app/konto/actions";
import { sql, sqlSession } from "./sql";

const visitor = vi.hoisted(() => ({ cookies: [] as TestCookie[] }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => visitor.cookies,
  set: (name: string, value: string) => { visitor.cookies = [...visitor.cookies.filter(c => c.name !== name), { name, value }]; },
}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
let f: Fixtures;
let jobIds: string[];
beforeEach(async () => {
  f = await createFixtures(); jobIds = [];
  const config = testConfig();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", config.url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", config.anonKey);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", config.serviceKey);
  visitor.cookies = f.a.cookies();
});
afterEach(async () => {
  vi.restoreAllMocks(); vi.unstubAllEnvs();
  if (f && jobIds.length) await f.verifier.from("deletion_jobs").delete().in("id", jobIds);
  await f?.cleanup();
});
async function member() {
  const m = await f.invitedUser();
  const invitation = await f.a.client.rpc("create_company_invitation", { p_email: m.email });
  expect(invitation.error).toBeNull();
  expect((await m.client.rpc("accept_company_invitation", { p_token: invitation.data![0].token })).error).toBeNull();
  return m;
}
async function start(deleteMembers = false, deleteSelf = false) {
  const p = await getDeletionPreview(f.a.client, f.a.company.id);
  const result = await f.verifier.rpc("start_company_deletion", {
    p_actor_id: f.a.userId, p_company_id: f.a.company.id, p_fingerprint: p.fingerprint,
    p_delete_members: deleteMembers, p_delete_self: deleteSelf,
  });
  expect(result.error).toBeNull(); jobIds.push(result.data!); return result.data!;
}
function form(values: Record<string, string>) {
  const result = new FormData(); for (const [k, v] of Object.entries(values)) result.set(k, v); return result;
}
async function companyForm(overrides: Record<string,string> = {}) {
  const p = await getDeletionPreview(f.a.client, f.a.company.id);
  return form({ intent: "company", company_id: p.companyId, fingerprint: p.fingerprint, company_name: p.companyName,
    password: f.a.password, understood: "yes", delete_members: "no", delete_self: "no", ...overrides });
}

describe("P2-1: bestätigte Firmenlöschung", () => {
  it.each([[false,false],[true,false],[false,true],[true,true]])("respektiert Mitarbeiter=%s und eigenes Konto=%s unabhängig", async (removeMembers,removeSelf) => {
    const m = await member();
    const invitationUser = await f.invitedUser();
    const invitation = await f.a.client.rpc("create_company_invitation", { p_email: invitationUser.email });
    const id = await start(removeMembers,removeSelf);
    expect((await f.a.client.from("products").select("id")).data).toEqual([]);
    expect((await m.client.from("products").select("id")).data).toEqual([]);
    expect((await invitationUser.client.rpc("accept_company_invitation", { p_token: invitation.data![0].token })).error).not.toBeNull();
    expect(await getOeffentlicherPass(f.anon, f.a.published.public_id)).toBeNull();
    expect(await getPublicFile(f.anon, f.a.published.public_id, f.a.publicDoc.id)).toEqual({ status: "unavailable" });
    expect(await runDeletionJob(f.verifier,id)).toEqual({ complete:true, failed:false });
    expect(!!(await f.verifier.auth.admin.getUserById(m.userId)).data.user).toBe(!removeMembers);
    expect(!!(await f.verifier.auth.admin.getUserById(f.a.userId)).data.user).toBe(!removeSelf);
    expect((await f.verifier.from("manufacturer_memberships").select().eq("manufacturer_id",f.a.company.id)).data).toEqual([]);
    expect((await f.b.client.from("products").select("id")).data).toHaveLength(2);
    expect((await f.b.client.storage.from("produkt-dokumente").download(f.b.publicDoc.file_path!)).error).toBeNull();
    expect((await f.verifier.storage.from("produkt-dokumente").download(f.a.publicDoc.file_path!)).error).not.toBeNull();
    expect((await f.verifier.from("file_operations").select("id").eq("manufacturer_id",f.a.company.id)).data).toEqual([]);
    const reserved = await sql(`select count(*) from private.product_public_ids where public_id in ('${f.a.published.public_id}','${f.a.draft.public_id}');`);
    expect(reserved.output.trim()).toBe("2");
    expect(await runDeletionJob(f.verifier,id)).toEqual({ complete:true,failed:false });
  });
  it("sperrt direkten Start, fremde Vorschau und unberechtigte Ziele", async () => {
    const m = await member();
    expect((await m.client.rpc("company_deletion_preview",{p_company_id:f.a.company.id})).error?.code).toBe("42501");
    expect((await f.a.client.rpc("company_deletion_preview",{p_company_id:f.b.company.id})).error?.code).toBe("42501");
    const args = {p_actor_id:f.a.userId,p_company_id:f.a.company.id,p_fingerprint:"x",p_delete_members:true,p_delete_self:true};
    expect((await f.a.client.rpc("start_company_deletion",args)).error?.code).toBe("42501");
    expect((await f.verifier.rpc("start_company_deletion",{...args,p_actor_id:m.userId})).error?.code).toBe("42501");
    expect((await f.a.client.from("deletion_jobs").insert({actor_id:f.a.userId,delete_members:true,delete_self:true})).error?.code).toBe("42501");
    expect((await f.a.client.from("products").select("id")).data).toHaveLength(2);
  });
  it("verwirft veraltete Bestätigungen nach neuem Mitarbeiter oder Produktänderung", async () => {
    const before = await getDeletionPreview(f.a.client,f.a.company.id);
    await member();
    const args={p_actor_id:f.a.userId,p_company_id:f.a.company.id,p_fingerprint:before.fingerprint,p_delete_members:true,p_delete_self:false};
    expect((await f.verifier.rpc("start_company_deletion",args)).error?.code).toBe("40001");
    const current = await getDeletionPreview(f.a.client,f.a.company.id);
    expect((await saveFixtureProduct(f.a.client,f.a.draft.id,{p_name:"Zwischenzeitlich geändert"})).error).toBeNull();
    expect((await f.verifier.rpc("start_company_deletion",{...args,p_fingerprint:current.fingerprint})).error?.code).toBe("40001");
    expect((await f.verifier.from("deletion_jobs").select().eq("company_id",f.a.company.id)).data).toEqual([]);
  });
  it("erhält den Auftrag bei Storage-Ausfall und sperrt späte Uploads sowie Firmenbeitritt vorgemerkter Konten", async () => {
    const m = await member();
    const op = await m.client.rpc("reserve_document_upload",{p_product_id:f.a.draft.id,p_file_name:"abbruch.pdf"});
    expect(op.error).toBeNull();
    expect((await m.client.storage.from("produkt-dokumente").upload(op.data!.file_path,"test",{contentType:"application/pdf"})).error).toBeNull();
    const id = await start(true,false);
    const storage = vi.spyOn(f.verifier.storage,"from").mockImplementation(() => ({remove:async()=>({error:new Error("simulierter Ausfall")})}) as unknown as ReturnType<typeof f.verifier.storage.from>);
    expect(await runDeletionJob(f.verifier,id)).toEqual({complete:false,failed:true}); storage.mockRestore();
    expect((await f.verifier.rpc("start_account_deletion",{p_actor_id:f.a.userId})).error?.code).toBe("23514");
    expect((await f.verifier.auth.admin.getUserById(m.userId)).data.user).not.toBeNull();
    expect((await m.client.storage.from("produkt-dokumente").upload(op.data!.file_path,"late",{contentType:"application/pdf"})).error).not.toBeNull();
    const invitation = await f.b.client.rpc("create_company_invitation",{p_email:m.email});
    expect((await m.client.rpc("accept_company_invitation",{p_token:invitation.data![0].token})).error?.code).toBe("42501");
    expect((await f.b.client.from("deletion_jobs").select().eq("id",id)).data).toEqual([]);
    visitor.cookies=f.b.cookies();
    expect((await deletionAction({},form({intent:"continue",job_id:id}))).error).toContain("kein Zugriff");
    // Neuer Prozess ohne Nutzer-Cookies setzt den persistierten Auftrag fort.
    const worker=spawnSync(process.execPath,["scripts/deletion-worker.mjs","--once","--job",id],{env:process.env,windowsHide:true,encoding:"utf8",timeout:15000});
    expect(worker.status,worker.stderr).toBe(0);
    expect((await f.verifier.from("deletion_jobs").select("state").eq("id",id).single()).data?.state).toBe("completed");
  });
  it("prüft Passwort, explizite Auswahlen und Firmenname in der echten Action", async () => {
    expect((await deletionAction({},await companyForm({password:"falsch"}))).error).toContain("Passwortbestätigung");
    expect((await deletionAction({},await companyForm({company_name:"Andere Firma"}))).error).toContain("Firmennamen");
    expect((await deletionAction({},await companyForm({delete_members:""}))).error).toContain("Auswahl");
    expect((await deletionAction({},await companyForm({understood:"no"}))).error).toContain("bestätigen");
    const success=await deletionAction({},await companyForm());
    expect(success).toMatchObject({complete:true,deleteSelf:false}); jobIds.push(success.jobId!);
  });
  it("lässt einen parallel bereits wartenden Produkt-Write nach dem Löschcommit nicht mehr durch", async () => {
    const p=await getDeletionPreview(f.a.client,f.a.company.id);
    const saveArgs=await fixtureSaveArgs(f.a.client,f.a.draft.id);
    const session=sqlSession();
    try {
      const output=await session.query(`begin; set local role service_role; select public.start_company_deletion('${f.a.userId}','${f.a.company.id}','${p.fingerprint}',false,false);`);
      const id=output.match(/[a-f0-9]{8}-[a-f0-9-]{27}/)?.[0]; if(id) jobIds.push(id);
      const change=Promise.resolve(f.a.client.rpc("save_product_checked",{...saveArgs,p_name:"Zu spät"}));
      await vi.waitFor(async()=>{const locks=await sql("select count(*) from pg_stat_activity where wait_event_type='Lock' and query ilike '%save_product_checked%' and pid<>pg_backend_pid();");expect(Number(locks.output.trim())).toBeGreaterThan(0);},{timeout:4000});
      session.end("commit;");expect((await session.done).code).toBe(0);
      const result=await change;expect(result.error).not.toBeNull();
      const job=await f.verifier.from("deletion_jobs").select("id").eq("company_id",f.a.company.id).single();
      expect(await runDeletionJob(f.verifier,job.data!.id)).toEqual({complete:true,failed:false});
    } finally {session.end("rollback;");await session.done;}
  });
});

it("verhindert alleinige Verantwortlichenlöschung; nach Übergabe bleiben gemeinsame Daten beim Nachfolger", async () => {
  expect((await f.verifier.rpc("start_account_deletion",{p_actor_id:f.a.userId})).error?.code).toBe("23514");
  const m=await member();
  expect((await f.a.client.rpc("transfer_company_ownership",{p_user_id:m.userId})).error).toBeNull();
  const result=await f.verifier.rpc("start_account_deletion",{p_actor_id:f.a.userId});expect(result.error).toBeNull();jobIds.push(result.data!);
  expect(await runDeletionJob(f.verifier,result.data!)).toEqual({complete:true,failed:false});
  expect((await m.client.from("products").select("id")).data).toHaveLength(2);
  expect((await m.client.storage.from("produkt-dokumente").download(f.a.publicDoc.file_path!)).error).toBeNull();
  expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).not.toBeNull();
  expect((await m.client.from("file_operations").select("owner_id")).data?.every(row=>row.owner_id===null)).toBe(true);
});

it("löscht ein mitgliedschaftsloses Konto über die echte Action und meldet es ab", async () => {
  const m=await f.invitedUser(); visitor.cookies=m.cookies();
  const originalRunner = deletionRunner.runDeletionJob;
  vi.spyOn(deletionRunner, "runDeletionJob").mockImplementation((admin, id) => {
    jobIds.push(id);
    return originalRunner(admin, id);
  });
  await expect(deletionAction({},form({intent:"account",password:m.password,confirmation:"KONTO LÖSCHEN",understood:"yes"}))).rejects.toMatchObject({digest:"NEXT_REDIRECT;replace;/konto-geloescht;307;"});
  expect((await f.verifier.auth.admin.getUserById(m.userId)).data.user).toBeNull();
  expect(jobIds).toHaveLength(1);
});
