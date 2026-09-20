// app/auth/confirm/route.ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sicheresInternesZiel } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sicheresInternesZiel(searchParams.get("next"), request.url);

  const weiter = (url: URL) => {
    // Next normalisiert lokale IPs in request.url teilweise zu localhost.
    // Eine relative Location erhält die tatsächliche Cookie-Origin. Ein nach
    // Normalisierung doppelter Slash darf dabei niemals zur fremden Authority werden.
    const location = url.pathname.startsWith("//") ? "/dashboard" : `${url.pathname}${url.search}${url.hash}`;
    const response = new NextResponse(null, { status: 307, headers: { Location: location } });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  if (token_hash && type && ["email", "signup", "recovery"].includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return weiter(next);
    }
  }
  return weiter(new URL("/login?fehler=bestaetigung", request.url));
}
