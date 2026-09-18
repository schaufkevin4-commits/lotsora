import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, rmSync } from "node:fs";
import { once } from "node:events";
import { test, expect } from "vitest";
import { createFixtures } from "./fixtures";

// Ausschließlich explizite lokale Browserprüfung; keine produktive Loginroute.
test.skipIf(process.env.LOTSORA_TEST_BROWSER !== "1")("lokale Browserprüfung", async () => {
  const ready = ".local-tests/n8-browser-ready.json";
  const stop = ".local-tests/n8-browser-stop";
  rmSync(stop, { force: true });
  const f = await createFixtures();
  const token = randomUUID();
  const base = "http://127.0.0.1:3109";
  const editor = `${base}/produkte/${f.a.published.id}`;
  const bootstrap = createServer((req, res) => {
    if (req.url !== `/${token}`) { res.writeHead(404).end(); return; }
    res.writeHead(302, {
      "Set-Cookie": f.a.cookies().map(c => `${c.name}=${c.value}; Path=/; HttpOnly; SameSite=Lax`),
      Location: editor,
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
    writeFileSync(ready, JSON.stringify({ login: `http://127.0.0.1:3110/${token}`, editor, public: `${base}/p/${f.a.published.public_id}` }));
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
