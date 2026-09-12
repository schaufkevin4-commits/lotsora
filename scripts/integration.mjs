import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workdir = join(root, ".local-tests", "integration");
const projectId = "lotsora-integration";
const marker = join(workdir, ".lotsora-test-project");
const env = { ...process.env, SUPABASE_TELEMETRY_DISABLED: "1" };

// Docker Desktop unterstützt auch eine Installation im Benutzerprofil.
if (process.platform === "win32") {
  const candidates = [
    join(process.env.LOCALAPPDATA ?? "", "Programs", "DockerDesktop", "resources", "bin"),
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Docker", "Docker", "resources", "bin"),
  ];
  const dockerDir = candidates.find((dir) => existsSync(join(dir, "docker.exe")));
  if (dockerDir) env.PATH = `${dockerDir}${delimiter}${process.env.PATH ?? ""}`;
}

function command(script, args, extraEnv = {}, inherit = false) {
  const result = spawnSync(process.execPath, [join(root, script), ...args], {
    cwd: root,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    // CLI-Ausgaben können lokale Schlüssel enthalten: keine Statusdaten ausgeben.
    const message = (result.stderr ?? "")
      .replace(/eyJ[A-Za-z0-9_.-]+/g, "[JWT entfernt]")
      .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[Schlüssel entfernt]")
      .replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[DB-URL entfernt]");
    throw new Error(`Befehl fehlgeschlagen (${result.status}): ${args[0]}\n${message.slice(-6000)}`);
  }
  return result.stdout ?? "";
}

function cli(args) {
  return command("node_modules/supabase/dist/supabase.js", [...args, "--workdir", workdir]);
}

function verifyProject() {
  if (!existsSync(marker) || readFileSync(marker, "utf8") !== projectId) {
    throw new Error("Isolierte Testinstanz fehlt. Zuerst npm run test:integration:start ausführen.");
  }
  const config = readFileSync(join(workdir, "supabase", "config.toml"), "utf8");
  if (!/^project_id = "lotsora-integration"$/m.test(config) || !/^port = 55321$/m.test(config)) {
    throw new Error("Unerwartete Projektkennung/Ports: Abbruch.");
  }
  if (existsSync(join(workdir, "supabase", ".temp", "project-ref"))) {
    throw new Error("Testinstanz darf nicht mit einem Cloud-Projekt verknüpft sein.");
  }
}

function prepare() {
  if (existsSync(workdir)) verifyProject();
  mkdirSync(join(workdir, "supabase", "migrations"), { recursive: true });
  writeFileSync(marker, projectId);
  copyFileSync(join(root, "tests/integration/supabase.config.toml"), join(workdir, "supabase/config.toml"));
  const sourceDir = join(root, "supabase/migrations");
  const targetDir = join(workdir, "supabase/migrations");
  const files = readdirSync(sourceDir).filter((file) => file.endsWith(".sql"));
  const unexpected = readdirSync(targetDir).filter((file) => !files.includes(file));
  if (unexpected.length) throw new Error(`Fremde/veraltete Testmigrationen: ${unexpected.join(", ")}`);
  for (const file of files) copyFileSync(join(sourceDir, file), join(targetDir, file));
  verifyProject();
  console.log(`Testprojekt ${projectId}: ${files.length} Migrationen, API-Port 55321.`);
}

try {
  const action = process.argv[2];
  if (action === "start") {
    prepare();
    console.log("Starte isolierte Supabase-Container; erster Start kann Images herunterladen.");
    cli(["start", "--exclude", "studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor"]);
    console.log("Isolierte Testinstanz gestartet. Entwicklungsprojekt lotsora unverändert.");
  } else if (action === "migrate") {
    prepare();
    cli(["migration", "up", "--local"]);
    console.log("Migrationen ausschließlich auf lotsora-integration angewendet.");
  } else if (action === "test") {
    verifyProject();
    const status = JSON.parse(cli(["status", "--output", "json"]));
    if (status.API_URL !== "http://127.0.0.1:55321" || !status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
      throw new Error("CLI liefert nicht die erwartete isolierte Testinstanz.");
    }
    command("node_modules/vitest/vitest.mjs", ["run", "--config", "vitest.integration.config.mts", ...process.argv.slice(3)], {
      LOTSORA_TEST_URL: status.API_URL,
      LOTSORA_TEST_ANON_KEY: status.ANON_KEY,
      LOTSORA_TEST_SERVICE_KEY: status.SERVICE_ROLE_KEY,
    }, true);
  } else if (action === "stop") {
    verifyProject();
    cli(["stop"]);
    console.log("Testinstanz gestoppt; Testvolumes bleiben erhalten.");
  } else {
    throw new Error("Erlaubte Aktionen: start, test, migrate, stop. Kein Reset oder Cloudzugriff.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Integrationstest fehlgeschlagen.");
  process.exitCode = 1;
}
