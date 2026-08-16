import Link from "next/link";

export default function RegistriertPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Fast geschafft</h1>
      <p className="text-muted-foreground">
        Wir haben dir eine E-Mail zur Bestätigung geschickt. Bitte prüfe dein Postfach und folge
        dem Link. Danach kannst du dich anmelden.
      </p>
      <Link href="/login" className="underline">Zur Anmeldung</Link>
    </main>
  );
}