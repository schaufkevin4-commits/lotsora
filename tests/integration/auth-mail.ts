import { testConfig } from "./fixtures";

// Ausschließlich der Mailfänger der isolierten Testinstanz, keine echten Postfächer.
const mailbox = "http://127.0.0.1:55324";
export async function authMail(email: string, type: "email" | "recovery" = "email") {
  testConfig();
  if (!/^lotsora-[a-z-]+-[0-9a-f-]+@example\.invalid$/.test(email)) throw new Error("Nur synthetische Testadressen erlaubt.");
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await fetch(`${mailbox}/api/v1/messages`);
    if (!response.ok) throw new Error("Lokaler Mailfänger nicht erreichbar.");
    const inbox = await response.json() as { messages: { ID: string; To: { Address: string }[] }[] };
    for (const match of inbox.messages.filter(message => message.To.some(to => to.Address === email))) {
      const message = await (await fetch(`${mailbox}/api/v1/message/${match.ID}`)).json() as { HTML: string };
      const link = message.HTML.match(/href="([^"]+)"/i)?.[1]?.replaceAll("&amp;", "&");
      if (!link) throw new Error("Kein Bestätigungslink in der Testmail.");
      const url = new URL(link);
      if (url.searchParams.get("type") === type) return { id: match.ID, url };
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error("Keine Auth-Mail für das synthetische Testkonto angekommen.");
}
