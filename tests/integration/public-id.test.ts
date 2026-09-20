import { afterAll, beforeAll, expect, test } from "vitest";
import { createFixtures, type Fixtures } from "./fixtures";
import { asManufacturer, sql } from "./sql";

let f: Fixtures;
beforeAll(async () => { f = await createFixtures(); });
afterAll(async () => { await f?.cleanup(); });

test("öffentliche ID wird trotz Clientvorgabe erzeugt und bleibt unveränderlich", async () => {
  const result = await f.a.client.from("products").insert({
    manufacturer_id: f.a.company.id, name: "ID-Test", description: "Test", category: "Textil", status: "entwurf", public_id: "Client-Wunsch",
  }).select().single();
  expect(result.error).toBeNull();
  const product = result.data!;
  expect(product.public_id).toMatch(/^[1-9A-HJ-NP-Za-km-z]{12}$/);
  expect(product.public_id).not.toBe("Client-Wunsch");
  for (const public_id of [f.a.published.public_id, null]) {
    expect((await f.a.client.from("products").update({ public_id: public_id! }).eq("id", product.id)).error?.code).toBe("22023");
  }
  expect((await f.a.client.from("products").select("public_id").eq("id", product.id).single()).data?.public_id).toBe(product.public_id);
});

test("gelöschte ID bleibt reserviert und kann keinem neuen Produkt zugewiesen werden", async () => {
  const created = await f.a.client.from("products").insert({ manufacturer_id: f.a.company.id, name: "Reservierung", description: "Test", category: "Textil", status: "entwurf" }).select().single();
  expect(created.error).toBeNull();
  const old = created.data!;
  expect((await f.a.client.from("products").delete().eq("id", old.id)).error).toBeNull();
  const replacement = await f.a.client.from("products").insert({ manufacturer_id: f.a.company.id, name: "Neues Produkt", description: "Test", category: "Textil", status: "entwurf", public_id: old.public_id }).select().single();
  expect(replacement.error).toBeNull();
  expect(replacement.data?.public_id).not.toBe(old.public_id);
  expect((await sql(`select count(*) from private.product_public_ids where public_id='${old.public_id}';`)).output.trim()).toBe("1");
  const denied = await sql(`${asManufacturer(f.a.userId)} delete from private.product_public_ids where public_id='${old.public_id}'; commit;`);
  expect(denied.code).not.toBe(0);
  expect(denied.output).toContain("42501");
});

test("echte Generatorkollision wird übersprungen; Fehler-Injektion bleibt in zurückgerollter Transaktion", async () => {
  const candidate = (await f.a.client.rpc("generate_product_public_id")).data!;
  expect(candidate).toMatch(/^[1-9A-HJ-NP-Za-km-z]{12}$/);
  const result = await sql(`begin;
    create or replace function public.generate_product_public_id() returns text language plpgsql volatile security definer set search_path='' as $$
    begin
      if current_setting('lotsora.collision_done',true) is distinct from 'yes' then
        perform set_config('lotsora.collision_done','yes',true); return '${f.a.draft.public_id}';
      end if;
      return '${candidate}';
    end $$;
    set local role authenticated;
    select set_config('request.jwt.claim.sub','${f.a.userId}',true);
    insert into public.products(manufacturer_id,name,description,category,status,public_id) values('${f.a.company.id}','Kollisionstest','Test','Textil','entwurf',null) returning public_id;
    rollback;`);
  expect(result.code, result.output).toBe(0);
  expect(result.output).toContain(candidate);
  expect((await sql(`select count(*) from private.product_public_ids where public_id='${candidate}';`)).output.trim()).toBe("0");
});
