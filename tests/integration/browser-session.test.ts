import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, rmSync } from "node:fs";
import { once } from "node:events";
import { test, expect } from "vitest";
import { createFixtures, pdfBytes } from "./fixtures";
import { authMail } from "./auth-mail";
import sharp from "sharp";

// Ausschließlich explizite lokale Browserprüfung; keine produktive Loginroute.
test.skipIf(process.env.LOTSORA_TEST_BROWSER !== "1")("lokale Browserprüfung", async () => {
  const ready = ".local-tests/n8-browser-ready.json";
  const stop = ".local-tests/n8-browser-stop";
  rmSync(stop, { force: true });
  const f = await createFixtures();
  const base = "http://127.0.0.1:3109";
  const teamDemo = process.env.LOTSORA_TEST_TEAM_BROWSER === "1";
  const gateDemo = process.env.LOTSORA_TEST_GATE_BROWSER === "1";
  const email = `lotsora-gate-${randomUUID()}@example.invalid`;
  let confirmation: string | undefined;
  let inviteToken: string | undefined;
  if (gateDemo) {
    const invited = await f.a.client.rpc("create_company_invitation", { p_email: email });
    if (invited.error) throw invited.error;
    inviteToken = invited.data![0].token;
  }
  const member = gateDemo ? await f.pendingUser(`${base}/auth/confirm?next=/einladung/${inviteToken}`, true, email)
    : teamDemo ? await f.invitedUser() : null;
  if (gateDemo && member) {
    confirmation = (await authMail(member.email)).url.toString();
    writeFileSync(".local-tests/gate-datenblatt.pdf", await pdfBytes());
    writeFileSync(".local-tests/gate-produktbild.png", await sharp({ create: { width: 320, height: 320, channels: 3, background: "#175f68" } }).png().toBuffer());
  }
  const token = randomUUID();
  const editor = `${base}/produkte/${f.a.published.id}`;
  const bootstrap = createServer(async (req, res) => {
    const memberLogin = member && req.url === `/${token}/member`;
    if (req.url !== `/${token}` && !memberLogin) { res.writeHead(404).end(); return; }
    const account = memberLogin ? member : f.a;
    // Reguläres Abmelden widerruft die Sitzung: jeden Testzugang neu anmelden.
    const login = await account.client.auth.signInWithPassword({ email: account.email, password: account.password });
    if (login.error) { res.writeHead(403).end("Testanmeldung fehlgeschlagen. Gegebenenfalls zuerst E-Mail bestätigen."); return; }
    const cookies = account.cookies().filter(c => c.value);
    // Auch beim Wechsel zwischen ungeteilten und aufgeteilten Cookies darf
    // kein Cookie des vorherigen Testkontos die neue Sitzung überlagern.
    const incomingNames = (req.headers.cookie ?? "").split(";").map(c => c.trim().split("=")[0]);
    const clear = incomingNames.filter(name => /^sb-127-auth-token(?:[.-][a-zA-Z0-9.-]+)?$/.test(name)
      && !cookies.some(c => c.name === name));
    res.writeHead(302, {
      "Set-Cookie": [
        ...clear.map(name => `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`),
        ...cookies.map(c => `${c.name}=${c.value}; Path=/; HttpOnly; SameSite=Lax`),
      ],
      Location: teamDemo ? `${base}/team` : editor,
      "Cache-Control": "no-store",
    }).end();
  });
  const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3109"], {
    env: process.env, windowsHide: true, stdio: "inherit",
  });
  try {
    bootstrap.listen(3110, "127.0.0.1");
    await once(bootstrap, "listening");
    let healthy = false;
    for (let i = 0; i < 90; i++) {
      try { healthy = (await fetch(`${base}/login`)).ok; } catch {}
      if (healthy) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    expect(healthy).toBe(true);
    writeFileSync(ready, JSON.stringify({ login: `http://127.0.0.1:3110/${token}`, editor, public: `${base}/p/${f.a.published.public_id}`,
      ...(member ? { memberLogin: `http://127.0.0.1:3110/${token}/member`, memberEmail: member.email } : {}),
      ...(confirmation ? { confirmation } : {}) }));
    console.log("Lokaler Browser bereit auf Port 3109; Stop über .local-tests/n8-browser-stop.");
    const deadline = Date.now() + 40 * 60_000;
    while (!existsSync(stop) && Date.now() < deadline) await new Promise(r => setTimeout(r, 1000));
  } finally {
    next.kill();
    bootstrap.close();
    rmSync(ready, { force: true });
    rmSync(stop, { force: true });
    await f.cleanup();
  }
}, 45 * 60_000);
