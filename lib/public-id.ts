/** Öffentliche Produktpass-ID: 12 Zeichen Base58 ohne 0, O, I und l. */
const PUBLIC_ID_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{12}$/;

export function isValidPublicId(value: string): boolean {
  return PUBLIC_ID_PATTERN.test(value);
}
