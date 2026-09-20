import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { abmelden } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { EinladungFormular } from "./EinladungFormular";

export const metadata: Metadata = { title: "Teameinladung · Lotsora", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function EinladungPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <main className="mx-auto max-w-xl space-y-6 p-6 sm:py-16">
    <p className="text-sm text-muted-foreground">Lotsora</p>
    <h1 className="text-2xl font-semibold">Einladung ins Firmenteam</h1>
    <p>Melde dich mit der eingeladenen E-Mail-Adresse an. Die Adresse muss bestätigt sein. Anschließend kannst du dem Team beitreten und gemeinsam Produkte bearbeiten.</p>
    {user && <p className="break-all text-sm">Angemeldet als <strong>{user.email}</strong></p>}
    <EinladungFormular token={token} signedIn={!!user} />
    {user && <form action={abmelden}><p className="mb-2 text-sm text-muted-foreground">Falsches Konto? Melde dich ab und öffne den Einladungslink erneut.</p><Button variant="outline">Abmelden</Button></form>}
  </main>;
}
