import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicFile, publicFileResponse } from "@/lib/services/public-files";

export async function oeffentlicheDateiAntwort(publicId: string, documentId?: string) {
  try {
    return publicFileResponse(await getPublicFile(createPublicClient(), publicId, documentId));
  } catch {
    return publicFileResponse({ status: "error" });
  }
}
