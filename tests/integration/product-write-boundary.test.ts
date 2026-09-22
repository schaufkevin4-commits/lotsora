import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createFixtures, type Fixtures } from "./fixtures";
import { fixtureSaveArgs, saveFixtureProduct, fixturePublicationToken } from "./product-write";
import { asManufacturer, sql, sqlSession } from "./sql";

let f: Fixtures;
beforeAll(async () => { f = await createFixtures(); });
afterAll(async () => { await f?.cleanup(); });

async function blocked(label: string) {
  await vi.waitFor(async () => {
    const state = await sql(`select count(*) from pg_stat_activity where application_name='${label}' and wait_event_type='Lock';`);
    expect(state.code).toBe(0); expect(state.output.trim()).toBe("1");
  }, { timeout: 4000, interval: 50 });
}
async function member() {
  const user = await f.invitedUser();
  const invitation = await f.a.client.rpc("create_company_invitation", {p_email:user.email});
  expect(invitation.error).toBeNull();
  expect((await user.client.rpc("accept_company_invitation",{p_token:invitation.data![0].token})).error).toBeNull();
  return user;
}
describe("P2-3: ausschließliche versionierte Formular- und Statusschreibwege", () => {
  it("interne Rolle ist ohne Login, ohne RLS-Bypass und für API-Rollen nicht erreichbar", async () => {
    const result = await sql(`select not rolcanlogin and not rolbypassrls and not rolsuper
      and not pg_has_role('authenticated',oid,'MEMBER') and not pg_has_role('authenticator',oid,'MEMBER')
      and not pg_has_role('anon',oid,'MEMBER') from pg_roles where rolname='lotsora_product_writer';
      select bool_and(relowner <> 'lotsora_product_writer'::regrole and relrowsecurity) from pg_class
      where oid in ('public.products'::regclass,'public.product_materials'::regclass,'public.product_textile_data'::regclass,'public.product_sustainability'::regclass);
      select bool_and(prosecdef and proowner='lotsora_product_writer'::regrole and not has_function_privilege('anon',oid,'EXECUTE'))
      from pg_proc where pronamespace='public'::regnamespace and proname in ('save_product_checked','publish_product_revision','set_product_image');
      select not has_function_privilege('authenticated','private.lock_product_editor(uuid)','EXECUTE');`);
    expect(result.code,result.output).toBe(0); expect(result.output.trim().split(/\r?\n/)).toEqual(["t","t","t","t"]);
  });
  it("auch Spaltenrechte und erweiterte Tabellenrechte eröffnen keinen Nebenweg", async () => {
    const result = await sql(`select bool_and(not has_column_privilege('authenticated',attrelid,attname,'UPDATE'))
      from pg_attribute where attrelid='public.products'::regclass and attnum>0 and not attisdropped;
      select bool_and(not has_table_privilege(r,t,p)) from
      unnest(array['authenticated','anon']) r cross join
      unnest(array['public.products','public.product_materials','public.product_textile_data','public.product_sustainability']) t
      cross join unnest(array['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN']) p;`);
    expect(result.code,result.output).toBe(0); expect(result.output.trim().split(/\r?\n/)).toEqual(["t","t"]);
  });
  it("alle älteren RPCs sind auch für den rechtmäßigen Eigentümer gesperrt", async () => {
    const checked = await fixtureSaveArgs(f.a.client,f.a.draft.id);
    const {p_expected_version: version,p_article_number: article,...old} = checked;
    expect(version).toBeGreaterThanOrEqual(0);
    for (const client of [f.a.client,f.b.client,f.anon]) {
      for (const name of ["publish_product","withdraw_product"] as const)
        expect((await client.rpc(name,{p_product_id:checked.p_product_id})).error?.code).toBe("42501");
      expect((await client.rpc("replace_product_materials",{p_product_id:checked.p_product_id,p_materials:[]})).error?.code).toBe("42501");
      expect((await client.rpc("save_product",old)).error?.code).toBe("42501");
      expect((await client.rpc("save_product_with_article",{...old,p_article_number:article})).error?.code).toBe("42501");
    }
    expect(await fixtureSaveArgs(f.a.client,f.a.draft.id)).toEqual(checked);
  });
  it("direkte Basis-, Status-, Versions-, Bild- und Upsert-Änderungen sind gesperrt", async () => {
    const p = f.a.draft; const before = await fixtureSaveArgs(f.a.client,p.id);
    for (const patch of [{name:"Umgehung"},{status:"veroeffentlicht" as const},{editor_version:0},{image_url:null},{manufacturer_id:f.b.company.id}])
      expect((await f.a.client.from("products").update(patch).eq("id",p.id)).error?.code).toBe("42501");
    expect((await f.a.client.from("products").upsert({...p,name:"Umgehung"})).error?.code).toBe("42501");
    expect(await fixtureSaveArgs(f.a.client,p.id)).toEqual(before);
  });
  it.each(["product_textile_data","product_sustainability"] as const)("direkte Teiländerungen an %s bleiben gesperrt", async table => {
    const p = f.a.draft;
    const row = {product_id:p.id};
    for (const write of [
      f.a.client.from(table).insert(row), f.a.client.from(table).upsert(row),
      f.a.client.from(table).update(row).eq("product_id",p.id),f.a.client.from(table).delete().eq("product_id",p.id),
    ]) expect((await write).error?.code).toBe("42501");
  });
  it("fehlende Versionsbestätigung oder Veröffentlichungsauswahl ändert nichts", async () => {
    const args=await fixtureSaveArgs(f.a.client,f.a.draft.id);
    expect((await f.a.client.rpc("save_product_checked",{...args,p_expected_version:null!})).error?.code).toBe("40001");
    expect((await f.a.client.rpc("publish_product_revision",{p_expected_token: await fixturePublicationToken(f.a.client,f.a.draft.id),p_product_id:args.p_product_id,p_expected_version:null!,p_publish:true})).error?.code).toBe("40001");
    expect((await f.a.client.rpc("publish_product_revision",{p_expected_token: await fixturePublicationToken(f.a.client,f.a.draft.id),p_product_id:args.p_product_id,p_expected_version:args.p_expected_version,p_publish:null!})).error?.code).toBe("22023");
    expect(await fixtureSaveArgs(f.a.client,f.a.draft.id)).toEqual(args);
  });
  it.each(["read committed","repeatable read"])("bereits laufende Sitzung verliert bei gleichzeitigem Mitgliedsentzug die Schreibrechte (%s)", async isolation => {
    const user = await member(); const p = f.a.draft; const args = await fixtureSaveArgs(user.client,p.id);
    const removal=sqlSession(), writer=sqlSession(), label=`p23_${randomUUID()}`;
    try {
      // Snapshot vor dem Entzug eröffnen, keine Schreibsperre halten.
      await writer.query(`${asManufacturer(user.userId,isolation)} select public.owns_product('${p.id}');`);
      await removal.query(`${asManufacturer(f.a.userId)} select public.remove_company_member('${user.userId}');`);
      writer.end(`set application_name='${label}'; select public.save_product_checked('${p.id}',${args.p_expected_version},'Zu spät','Text','Textil','','entwurf','[]','{}','{}',''); commit;`);
      await blocked(label); removal.end("commit;");
      expect((await removal.done).code).toBe(0);
      const rejected=await writer.done; expect(rejected.code).not.toBe(0);
      expect(rejected.output).toContain(isolation==="repeatable read"?"40001":"42501");
      expect(await fixtureSaveArgs(f.a.client,p.id)).toEqual(args);
      expect((await user.client.rpc("set_product_image",{p_product_id:p.id,p_expected_path:null!,p_new_path:null!})).error?.code).toBe("42501");
    } finally {removal.end("rollback;");writer.end("rollback;");await Promise.all([removal.done,writer.done]);}
  });
  it("ein bereits speicherndes Mitglied beendet atomar, bevor der Entzug wirksam wird", async () => {
    const user=await member(); const p=f.a.draft; const args=await fixtureSaveArgs(user.client,p.id);
    const writer=sqlSession(), removal=sqlSession(), label=`p23_${randomUUID()}`;
    try {
      await writer.query(`${asManufacturer(user.userId)} select public.save_product_checked('${p.id}',${args.p_expected_version},'Vor Entzug','Text','Textil','','entwurf','[]','{}','{}','');`);
      removal.end(`${asManufacturer(f.a.userId)} set application_name='${label}'; select public.remove_company_member('${user.userId}'); commit;`);
      await blocked(label); writer.end("commit;");
      expect((await writer.done).code).toBe(0); expect((await removal.done).code).toBe(0);
      expect((await fixtureSaveArgs(f.a.client,p.id)).p_name).toBe("Vor Entzug");
      expect((await user.client.rpc("save_product_checked",args)).error?.code).toBe("42501");
    } finally {writer.end("rollback;");removal.end("rollback;");await Promise.all([writer.done,removal.done]);}
  });
  it("zwei Änderungen bei gleichem Status können sich nicht unbemerkt überschreiben", async () => {
    const before = await fixtureSaveArgs(f.a.client,f.a.draft.id);
    expect((await saveFixtureProduct(f.a.client,f.a.draft.id,{p_brand:"Aktuell"})).error).toBeNull();
    const latest = await fixtureSaveArgs(f.a.client,f.a.draft.id);
    expect(latest.p_expected_status).toBe(before.p_expected_status);
    expect((await f.a.client.rpc("save_product_checked",{...before,p_name:"Veraltet"})).error?.code).toBe("40001");
    expect((await f.a.client.rpc("publish_product_revision",{p_expected_token: await fixturePublicationToken(f.a.client,f.a.draft.id),p_product_id:before.p_product_id,p_expected_version:before.p_expected_version,p_publish:true})).error?.code).toBe("40001");
    expect(await fixtureSaveArgs(f.a.client,f.a.draft.id)).toEqual(latest);
  });
});
