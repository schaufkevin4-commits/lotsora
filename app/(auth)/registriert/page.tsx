import { Zugangsseite } from "@/components/layout/zugangsseite";
import Link from "next/link";

export default function RegistriertPage() {
  return (
    <Zugangsseite titel="Fast geschafft">

      <p className="text-muted-foreground">
        Wir haben dir eine E-Mail zur Bestätigung geschickt. Bitte prüfe dein Postfach und folge
        dem Link. Danach kannst du dich anmelden.
      </p>
      <Link href="/login" className="underline">Zur Anmeldung</Link>
    </Zugangsseite>
  );
}