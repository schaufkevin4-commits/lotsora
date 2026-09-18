import { oeffentlicheDateiAntwort } from "@/lib/public-file-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const { id, documentId } = await params;
  return oeffentlicheDateiAntwort(id, documentId);
}
