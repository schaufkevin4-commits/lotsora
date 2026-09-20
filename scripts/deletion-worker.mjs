// Lokaler Worker für persistente Löschaufträge. Cloud-Anbindung bleibt P3.
// Auch bei geschlossenem Browser weiterarbeiten; keine Start-/Löschbefehle erzeugen.
import { createClient } from "@supabase/supabase-js";
import { runDeletionJob } from "../lib/services/deletion-runner.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (url !== "http://127.0.0.1:55321" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Dieser Worker ist ausschließlich für lotsora-integration auf Port 55321 bestimmt.");
}
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { stopping = true; });
console.log("Lokaler Löschworker aktiv; verarbeitet ausschließlich bereits bestätigte Aufträge.");
do {
  let query = admin.from("deletion_jobs").select("id").eq("state", "pending").order("created_at").limit(25);
  const jobArg = process.argv.indexOf("--job");
  if (jobArg !== -1) {
    const jobId = process.argv[jobArg + 1];
    if (!/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(jobId ?? "")) throw new Error("Ungültige Auftrags-ID.");
    query = query.eq("id", jobId);
  }
  const jobs = await query;
  if (jobs.error) console.error("Löschaufträge derzeit nicht lesbar; späterer Versuch.");
  else for (const job of jobs.data ?? []) {
    try { if ((await runDeletionJob(admin, job.id)).failed) console.error("Bereinigung offen; Auftrag bleibt gespeichert."); }
    catch { console.error("Bereinigung unterbrochen; Auftrag bleibt gespeichert."); }
  }
  if (process.argv.includes("--once")) break;
  if (!stopping) await new Promise(resolve => setTimeout(resolve, 5000));
} while (!stopping);
