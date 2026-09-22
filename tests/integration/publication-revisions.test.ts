import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createFixtures, type Fixtures } from "./fixtures";
import { fixtureSaveArgs, fixturePublicationToken, publishFixtureProduct, saveFixtureProduct } from "./product-write";
import { getOeffentlicherPass, getPublicationReview, deleteProdukt } from "@/lib/services/products";
import { getPublicFile } from "@/lib/services/public-files";
import { loescheDokument } from "@/lib/services/documents";
import { completeImageUpload } from "@/lib/services/upload-completion";
import { bereinigeProduktdateien } from "@/lib/services/file-cleanup";
import { asManufacturer, sql, sqlSession } from "./sql";
let f: Fixtures;
beforeEach(async () => { f=await createFixtures(); });
afterEach(async () => { await f?.cleanup(); });
async function release(publish=true) {
  const result=await publishFixtureProduct(f.a.client,f.a.published.id,publish);
  expect(result.error).toBeNull(); return result.data!;
}
async function image(old:string|null,color:string) {
  const reserved=await f.a.client.rpc("reserve_file_upload",{p_product_id:f.a.published.id,p_file_name:"revision.png",p_purpose:"image"});
  expect(reserved.error).toBeNull(); const op=reserved.data!;
  const bytes=await sharp({create:{width:8,height:8,channels:3,background:color}}).png().toBuffer();
  expect((await f.a.client.storage.from("produkt-dokumente").upload(op.file_path,bytes,{contentType:"image/png"})).error).toBeNull();
  expect(await completeImageUpload(f.a.client,f.verifier,op.id,old)).toEqual({complete:true}); return op;
}
describe("P2-4: vollständige bewusst freigegebene Stände",()=>{
  it("Autosave und unvollständiger Entwurf ändern keinerlei veröffentlichte Angaben",async()=>{
    const before=await getOeffentlicherPass(f.anon,f.a.published.public_id);
    expect((await saveFixtureProduct(f.a.client,f.a.published.id,{p_name:"",p_materials:[{material_name:"Leinen",percentage:80}],p_textile_data:{color:"Rot"},p_sustainability:{repair_notes:"Neu"}})).error).toBeNull();
    expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toEqual(before);
    const version=(await fixtureSaveArgs(f.a.client,f.a.published.id)).p_expected_version;
    expect((await publishFixtureProduct(f.a.client,f.a.published.id,true)).error?.code).toBe("23514");
    expect((await fixtureSaveArgs(f.a.client,f.a.published.id)).p_expected_version).toBe(version);
    expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toEqual(before);
    expect((await saveFixtureProduct(f.a.client,f.a.published.id,{p_name:"Bewusst freigegeben"})).error).toBeNull();
    await release();
    const after=await getOeffentlicherPass(f.anon,f.a.published.public_id);
    expect(after?.produkt.name).toBe("Bewusst freigegeben"); expect(after?.textildaten?.color).toBe("Rot");
    expect(after?.materialien.map(m=>m.material_name)).toEqual(["Leinen"]);
    expect(after?.produkt.public_id).toBe(before?.produkt.public_id);
    expect(after?.produkt.updated_at).not.toBe(before?.produkt.updated_at);
    expect((await getPublicationReview(f.a.client,f.a.published.id)).has_changes).toBe(false);
  });
  it("Firmenangaben und Dokumentauswahl verlangen dieselbe Gesamtfreigabe",async()=>{
    const before=await getOeffentlicherPass(f.anon,f.a.published.public_id);
    const args=await fixtureSaveArgs(f.a.client,f.a.published.id);
    const token=await fixturePublicationToken(f.a.client,f.a.published.id);
    expect((await f.a.client.from("manufacturers").update({company_name:"Neue Firma"}).eq("id",f.a.company.id)).error).toBeNull();
    expect((await f.a.client.from("documents").update({visibility:"oeffentlich"}).eq("id",f.a.internalDoc.id)).error).toBeNull();
    expect((await fixtureSaveArgs(f.a.client,f.a.published.id)).p_expected_version).toBe(args.p_expected_version);
    expect((await f.a.client.rpc("publish_product_revision",{p_product_id:f.a.published.id,p_expected_version:args.p_expected_version,p_expected_token:token,p_publish:true})).error?.code).toBe("40001");
    expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toEqual(before);
    expect((await f.anon.storage.from("produkt-dokumente").download(f.a.internalDoc.file_path!)).error).not.toBeNull();
    await release();
    expect((await getOeffentlicherPass(f.anon,f.a.published.public_id))?.hersteller?.company_name).toBe("Neue Firma");
    expect((await getOeffentlicherPass(f.anon,f.a.published.public_id))?.dokumente).toHaveLength(2);
  });
  it("entfernte veröffentlichte Dokumente behalten Datei bis Aktualisierung, danach aufräumbar",async()=>{
    expect(await loescheDokument(f.a.client,f.a.publicDoc.id)).toEqual({complete:true});
    expect((await getOeffentlicherPass(f.anon,f.a.published.public_id))?.dokumente).toHaveLength(1);
    expect((await getPublicFile(f.anon,f.a.published.public_id,f.a.publicDoc.id)).status).toBe("available");
    const op=(await f.a.client.from("file_operations").select().eq("file_path",f.a.publicDoc.file_path!).single()).data!;
    expect(op.state).toBe("attached");
    expect((await f.a.client.rpc("begin_file_cleanup",{p_operation_id:op.id})).error?.code).toBe("23514");
    expect((await f.a.client.storage.from("produkt-dokumente").remove([op.file_path])).data).toEqual([]);
    await release();
    expect((await getOeffentlicherPass(f.anon,f.a.published.public_id))?.dokumente).toEqual([]);
    expect(await getPublicFile(f.anon,f.a.published.public_id,f.a.publicDoc.id)).toEqual({status:"unavailable"});
    expect(await bereinigeProduktdateien(f.a.client,f.a.published.id)).toEqual({complete:true});
    expect((await f.verifier.storage.from("produkt-dokumente").download(op.file_path)).error).not.toBeNull();
  });
  it("Bildwechsel bleibt privat und erhält die bisher veröffentlichte Datei",async()=>{
    const old=await image(null,"red"); await release();
    expect((await getPublicFile(f.anon,f.a.published.public_id)).status).toBe("available");
    const next=await image(old.file_path,"blue");
    expect((await f.anon.storage.from("produkt-dokumente").download(next.file_path)).error).not.toBeNull();
    expect((await f.anon.storage.from("produkt-dokumente").download(old.file_path)).error).toBeNull();
    expect((await f.a.client.from("file_operations").select("state").eq("id",old.id).single()).data?.state).toBe("attached");
    await release();
    expect((await f.anon.storage.from("produkt-dokumente").download(next.file_path)).error).toBeNull();
    expect((await f.anon.storage.from("produkt-dokumente").download(old.file_path)).error).not.toBeNull();
    expect(await bereinigeProduktdateien(f.a.client,f.a.published.id)).toEqual({complete:true});
    expect((await f.verifier.storage.from("produkt-dokumente").download(old.file_path)).error).not.toBeNull();
  });
  it("Rücknahme sperrt neue Abrufe und löst nur nicht mehr benötigte Dateien",async()=>{
    await loescheDokument(f.a.client,f.a.publicDoc.id); await release(false);
    expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toBeNull();
    expect(await getPublicFile(f.anon,f.a.published.public_id,f.a.publicDoc.id)).toEqual({status:"unavailable"});
    expect(await bereinigeProduktdateien(f.a.client,f.a.published.id)).toEqual({complete:true});
    expect((await f.a.client.storage.from("produkt-dokumente").download(f.a.internalDoc.file_path!)).error).toBeNull();
    await release();
    expect((await getOeffentlicherPass(f.anon,f.a.published.public_id))?.produkt.public_id).toBe(f.a.published.public_id);
  });
  it("Produktlöschung entfernt auch den veröffentlichten Stand und seine erhaltenen Dateien",async()=>{
    await loescheDokument(f.a.client,f.a.publicDoc.id);
    expect(await deleteProdukt(f.a.client,f.a.published.id)).toEqual({complete:true});
    expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toBeNull();
    expect((await f.verifier.storage.from("produkt-dokumente").download(f.a.publicDoc.file_path!)).error).not.toBeNull();
  });
  it("fehlende neue Datei rollt die gesamte Freigabe zurück und erhält den bisherigen Pass",async()=>{
    const before=await getOeffentlicherPass(f.anon,f.a.published.public_id);
    const version=(await fixtureSaveArgs(f.a.client,f.a.published.id)).p_expected_version;
    const next=await image(null,"blue");
    // Absichtlicher externer Dateiverlust, kein erlaubter Nutzer-Löschweg.
    expect((await f.verifier.storage.from("produkt-dokumente").remove([next.file_path])).error).toBeNull();
    expect((await publishFixtureProduct(f.a.client,f.a.published.id,true)).error?.code).toBe("23514");
    expect((await fixtureSaveArgs(f.a.client,f.a.published.id)).p_expected_version).toBe(version);
    expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toEqual(before);
  });
  it("anonyme Tabellenabfragen und alter Veröffentlichungs-RPC öffnen keinen Entwurf",async()=>{
    for(const table of ["products","manufacturers","documents","product_materials","product_textile_data","product_sustainability"] as const)
      expect((await f.anon.from(table).select()).error?.code).toBe("42501");
    expect((await f.a.client.rpc("set_product_publication_checked",{p_product_id:f.a.published.id,p_expected_version:f.a.published.editor_version,p_publish:true})).error?.code).toBe("42501");
    for(const client of [f.b.client,f.anon]) {
      expect((await client.rpc("get_product_publication_review",{p_product_id:f.a.published.id})).error?.code).toBe("42501");
      expect((await client.rpc("publish_product_revision",{p_product_id:f.a.published.id,p_expected_version:f.a.published.editor_version,p_expected_token:"",p_publish:true})).error?.code).toBe("42501");
      expect(await getOeffentlicherPass(client,f.a.published.public_id)).toEqual(await getOeffentlicherPass(f.anon,f.a.published.public_id));
    }
    const serialized=JSON.stringify(await getOeffentlicherPass(f.anon,f.a.published.public_id));
    for(const hidden of ["file_path","editor_version","article_number","contact_person","Interne Testnotiz"]) expect(serialized).not.toContain(hidden);
  });
  it.each(["Dokument","Firma"])("gleichzeitige Änderung an %s verhindert veraltete Gesamtfreigabe",async field=>{
    for(const isolation of ["read committed","repeatable read"]) {
      const args=await fixtureSaveArgs(f.a.client,f.a.published.id);
      const token=await fixturePublicationToken(f.a.client,f.a.published.id);
      const before=await getOeffentlicherPass(f.anon,f.a.published.public_id);
      const writer=sqlSession(),publisher=sqlSession(),label="p24_"+randomUUID();
      try {
        await publisher.query(asManufacturer(f.a.userId,isolation)); await writer.query(asManufacturer(f.a.userId));
        await writer.query(field==="Dokument"
          ? "update public.documents set name='Neu "+label+"' where id='"+f.a.publicDoc.id+"';"
          : "update public.manufacturers set company_name='Neu "+label+"' where id='"+f.a.company.id+"';");
        publisher.end("set application_name='"+label+"'; select public.publish_product_revision('"+f.a.published.id+"',"+args.p_expected_version+",'"+token+"',true); commit;");
        await vi.waitFor(async()=>expect((await sql("select count(*) from pg_stat_activity where application_name='"+label+"' and wait_event_type='Lock';")).output.trim()).toBe("1"),{timeout:4000,interval:50});
        writer.end("commit;"); expect((await writer.done).code).toBe(0);
        const rejected=await publisher.done;expect(rejected.code,rejected.output).not.toBe(0);expect(rejected.output).toContain("40001");
        expect(await getOeffentlicherPass(f.anon,f.a.published.public_id)).toEqual(before);
      } finally {writer.end("rollback;");publisher.end("rollback;");await Promise.all([writer.done,publisher.done]);}
    }
  });
});
