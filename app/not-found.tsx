import Link from "next/link";
import { Zugangsseite } from "@/components/layout/zugangsseite";

export default function NichtGefunden() {
  return <Zugangsseite titel="Seite nicht gefunden">
    <p className="text-sm text-muted-foreground">Diese Seite ist nicht verfügbar. Prüfe die Adresse oder gehe zurück zur Startseite.</p>
    <Link href="/" className="inline-block text-sm underline">Zur Startseite</Link>
  </Zugangsseite>;
}
