export type CompanyEntryState = "ready" | "member" | "deleting" | "unconfirmed";

export function validCompanyName(value: string) {
  const name = value.trim();
  return name.length > 0 && [...name].length <= 200
    && ![...name].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}

export function companyCreationError(code?: string): { error: string; next?: "company" | "account" | "reload" } {
  switch (code) {
    case "P2201": return { error: "Dein Konto gehört inzwischen zu einer Firma. Öffne deinen bestehenden Firmenbereich.", next: "company" };
    case "P2202": return { error: "Für dein Konto läuft noch ein Löschvorgang. Schließe ihn zuerst ab.", next: "account" };
    case "P2203": return { error: "Dieser Vorgang ist nicht mehr aktuell. Lade die Seite neu, bevor du erneut beginnst.", next: "reload" };
    case "42501": return { error: "Bitte melde dich mit deiner bestätigten E-Mail-Adresse an." };
    case "22023": return { error: "Bitte einen Firmennamen mit 1 bis 200 Zeichen ohne Steuerzeichen angeben." };
    default: return { error: "Die Firma konnte nicht bestätigt werden. Bitte versuche es erneut. Ein bereits angelegter Firmenbereich wird dabei wiedergefunden." };
  }
}
