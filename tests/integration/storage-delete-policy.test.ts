import { afterAll, beforeAll, expect, test } from "vitest";
import { createFixtures, type Fixtures } from "./fixtures";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";
import { bereinigeDatei } from "@/lib/services/file-cleanup";

let f: Fixtures;
beforeAll(async () => { f = await createFixtures(); });
afterAll(async () => { await f?.cleanup(); });

test("angehängte Dateien widerstehen direkter Storage-Löschung; Team-Cleanup bleibt möglich", async () => {
  const member = await f.invitedUser();
  const invitation = await f.a.client.rpc("create_company_invitation", { p_email: member.email });
  expect(invitation.error).toBeNull();
  expect((await member.client.rpc("accept_company_invitation", { p_token: invitation.data![0].token })).error).toBeNull();
  const doc = f.a.internalDoc;
  const path = doc.file_path!;
  const operation = await member.client.from("file_operations").select("id,state").eq("file_path", path).single();
  expect(operation.error).toBeNull();
  expect(operation.data!.state).toBe("attached");

  for (const client of [member.client, f.a.client]) {
    const removed = await client.storage.from(DOKUMENTE_BUCKET).remove([path]);
    // Storage kann eine durch RLS gesperrte Löschung auch als leere Liste melden.
    expect(removed.data ?? []).toHaveLength(0);
    expect((await client.storage.from(DOKUMENTE_BUCKET).download(path)).error).toBeNull();
    expect((await client.from("documents").select("id").eq("id", doc.id)).data).toHaveLength(1);
    expect((await client.from("file_operations").select("state").eq("id", operation.data!.id).single()).data?.state).toBe("attached");
    expect((await client.rpc("begin_file_cleanup", { p_operation_id: operation.data!.id })).error?.code).toBe("23514");
  }

  expect((await member.client.from("documents").delete().eq("id", doc.id).select("id")).data).toHaveLength(1);
  expect((await member.client.from("file_operations").select("state").eq("id", operation.data!.id).single()).data?.state).toBe("cleanup");
  expect(await bereinigeDatei(member.client, operation.data!.id)).toEqual({ complete: true });
  expect((await member.client.from("file_operations").select("state").eq("id", operation.data!.id).single()).data?.state).toBe("deleted");
  expect((await member.client.storage.from(DOKUMENTE_BUCKET).download(path)).error).not.toBeNull();
});
