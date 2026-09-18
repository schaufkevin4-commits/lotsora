import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { isValidPublicId } from "@/lib/public-id";
import { DOKUMENTE_BUCKET } from "@/lib/services/documents";

export const PUBLIC_FILE_TTL_SECONDS = 300;
export type PublicFileResult =
  | { status: "available"; url: string }
  | { status: "unavailable" }
  | { status: "error" };

// Der öffentliche Transport übergibt ausschließlich den anonymen Client.
// Keine Pfade vom Besucher übernehmen; der aktuelle DB-Bezug ist maßgeblich.
export async function getPublicFile(
  supabase: SupabaseClient<Database>,
  publicId: string,
  documentId?: string,
  seconds = PUBLIC_FILE_TTL_SECONDS,
): Promise<PublicFileResult> {
  if (!isValidPublicId(publicId) || (documentId !== undefined &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId))) {
    return { status: "unavailable" };
  }
  try {
    const product = await supabase.from("products").select("id, status, image_url")
      .eq("public_id", publicId).maybeSingle();
    if (product.error) throw product.error;
    if (product.data?.status !== "veroeffentlicht") return { status: "unavailable" };
    let path = product.data.image_url;
    if (documentId !== undefined) {
      const document = await supabase.from("documents").select("file_path")
        .eq("id", documentId).eq("product_id", product.data.id)
        .eq("visibility", "oeffentlich").maybeSingle();
      if (document.error) throw document.error;
      path = document.data?.file_path ?? null;
    }
    if (!path || !path.startsWith(`${product.data.id}/`)) return { status: "unavailable" };
    // Storage prüft die aktuelle Freigabe beim Signieren erneut über RLS.
    const signed = await supabase.storage.from(DOKUMENTE_BUCKET).createSignedUrl(path, seconds);
    if (signed.error || !signed.data?.signedUrl) return { status: "error" };
    return { status: "available", url: signed.data.signedUrl };
  } catch {
    return { status: "error" };
  }
}

export function publicFileResponse(result: PublicFileResult): Response {
  const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
  if (result.status === "available") {
    return new Response(null, { status: 307, headers: { ...headers, Location: result.url } });
  }
  const temporary = result.status === "error";
  const message = temporary
    ? "Die Datei konnte vorübergehend nicht geladen werden. Bitte versuchen Sie es erneut."
    : "Diese Datei ist derzeit nicht öffentlich verfügbar.";
  return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Datei nicht verfügbar – lotsora</title><body><main><h1>Datei nicht verfügbar</h1><p>${message}</p><p><a href="">Erneut versuchen</a></p></main></body></html>`, {
    status: temporary ? 503 : 404,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8", ...(temporary ? { "Retry-After": "5" } : {}) },
  });
}
