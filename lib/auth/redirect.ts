// URL-Normalisierung kann etwa Slash + Tab + Slash zu einer fremden Origin machen.
// Das geprüfte URL-Objekt direkt weiterreichen, keinen erneut interpretierbaren Pfad.
export function sicheresInternesZiel(next: string | null, requestUrl: string): URL {
  const fallback = new URL("/dashboard", requestUrl);
  if (
    !next || !/^\/(?!\/)/.test(next) || next.includes("\\") ||
    [...next].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  ) return fallback;

  try {
    const target = new URL(next, requestUrl);
    return target.origin === fallback.origin ? target : fallback;
  } catch {
    return fallback;
  }
}
