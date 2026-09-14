import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { testConfig } from "./fixtures";

// Ausschließlich der feste lokale Testcontainer. Fachliche SQL-Fälle wechseln
// vor ihren Abfragen zu authenticated + synthetischer Nutzer-ID; PostgreSQL
// wird nur für Testaufbau, Fehler-Injektion und Beobachtung von Sperren benutzt.
export function sqlSession() {
  testConfig();
  const child = spawn("docker", ["exec", "-i", "supabase_db_lotsora-integration", "psql", "-XqAt", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", "-"], {
    windowsHide: true, stdio: "pipe",
  });
  let output = "";
  const listeners = new Set<() => void>();
  const append = (data: Buffer) => { output += data.toString(); for (const notify of listeners) notify(); };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  child.stdin.on("error", () => {});
  const done = new Promise<{ code: number | null; output: string }>((resolve) => {
    child.on("error", (error) => { output += error.message; });
    child.on("close", (code) => { resolve({ code, output }); for (const notify of listeners) notify(); });
  });
  child.stdin.write("\\set VERBOSITY verbose\nset statement_timeout = '8s';\nset lock_timeout = '5s';\n");
  return {
    done,
    send: (sql: string) => child.stdin.write(sql + "\n"),
    end: (sql = "") => child.stdin.end(sql + "\n"),
    async query(sql: string) {
      const marker = `b4_${randomUUID()}`;
      const start = output.length;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { listeners.delete(notify); reject(new Error(`SQL-Test wartet vergeblich: ${output.slice(start)}`)); }, 10_000);
        const notify = () => {
          if (output.slice(start).includes(marker)) {
            clearTimeout(timer); listeners.delete(notify); resolve();
          } else if (child.exitCode !== null) {
            clearTimeout(timer); listeners.delete(notify); reject(new Error(output.slice(start)));
          }
        };
        listeners.add(notify);
        child.stdin.write(`${sql}\n\\echo ${marker}\n`);
      });
      return output.slice(start);
    },
  };
}

export async function sql(sql: string) {
  const session = sqlSession();
  session.end(sql);
  return session.done;
}

export function asManufacturer(userId: string, isolation = "read committed") {
  if (!/^[a-f0-9-]{36}$/.test(userId) || !["read committed", "repeatable read"].includes(isolation)) throw new Error("Ungültige Testsession.");
  return `begin isolation level ${isolation}; set local role authenticated;
    select set_config('request.jwt.claim.sub', '${userId}', true);
    select current_user || ':' || auth.uid()::text;`;
}
