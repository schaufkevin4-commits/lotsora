export class SiteUrlFehler extends Error {
  constructor() {
    super("Die Website-Adresse ist nicht korrekt eingerichtet. Bitte wende dich an den Betreiber.");
    this.name = "SiteUrlFehler";
  }
}

/** Vor jeder Mutation prüfen, die einen Einladungs- oder Bestätigungslink erzeugt. */
export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value || !/^https?:\/\//i.test(value)) throw new SiteUrlFehler();
  let url: URL;
  try { url = new URL(value); } catch { throw new SiteUrlFehler(); }
  // Die App liegt am Ursprung; Pfade, Zugangsdaten und URL-Zusätze wären mehrdeutig.
  if (!url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new SiteUrlFehler();
  }
  return url.origin;
}
