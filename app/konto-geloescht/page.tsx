import Link from "next/link";

export default function KontoGeloeschtPage() {
  return <main className="mx-auto max-w-xl space-y-4 px-4 py-16"><h1 className="text-2xl font-semibold">Dein Konto wurde gelöscht</h1><p>Du bist abgemeldet. Die bestätigte Löschung ist abgeschlossen.</p><p className="text-sm text-muted-foreground">Bei einer Firmenlöschung bleiben bisherige öffentliche Pass-IDs dauerhaft reserviert. Die QR-Adressen zeigen keine Produktdaten mehr.</p><Link className="underline" href="/login">Zur Anmeldung</Link></main>;
}
