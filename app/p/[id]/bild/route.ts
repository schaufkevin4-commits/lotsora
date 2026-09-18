import { oeffentlicheDateiAntwort } from "@/lib/public-file-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return oeffentlicheDateiAntwort((await params).id);
}
