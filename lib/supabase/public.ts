import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Öffentliche Pässe werden immer als anon gelesen, unabhängig vom Herstellerlogin.
// Keine Sessionpersistenz, Cookies, Nutzer-Header oder privilegierten Schlüssel.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      db: { retry: false },
      global: {
        fetch: (input, init) => {
          const timeout = AbortSignal.timeout(8000);
          return fetch(input, {
            ...init,
            cache: "no-store",
            signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
          });
        },
      },
    },
  );
}
