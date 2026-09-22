import { Zugangsseite } from "@/components/layout/zugangsseite";
import Link from "next/link";

export default function KontoGeloeschtPage() {
  return <Zugangsseite titel="Dein Konto wurde gelöscht"><p>Du bist abgemeldet. Die bestätigte Löschung ist abgeschlossen.</p><p className="text-sm text-muted-foreground">Bei einer Firmenlöschung bleiben bisherige öffentliche Pass-IDs dauerhaft reserviert. Die QR-Adressen zeigen keine Produktdaten mehr.</p><Link className="underline" href="/login">Zur Anmeldung</Link></Zugangsseite>;
}
