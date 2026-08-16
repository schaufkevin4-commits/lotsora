// app/(intern)/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { abmelden } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doppelter Boden zusätzlich zur Middleware.
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/produkte" className="hover:underline">Produkte</Link>
          <Link href="/profil" className="hover:underline">Profil</Link>
        </nav>
        <form action={abmelden}>
          <Button type="submit" variant="ghost" size="sm">Abmelden</Button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}