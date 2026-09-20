import { describe, expect, it } from "vitest";
import { normalizeWebsite } from "./profile";

describe("Firmenwebsite", () => {
  it.each([
    ["", null], ["  ", null], [" www.firma.de ", "https://www.firma.de/"],
    ["https://firma.de/kontakt?lang=de#team", "https://firma.de/kontakt?lang=de#team"],
    ["http://firma.de", "http://firma.de/"], ["https://müller.de", "https://xn--mller-kva.de/"],
  ])("normalisiert %s", (input, expected) => expect(normalizeWebsite(input)).toBe(expected));
  it.each(["keine website", "firma", "https://", "javascript:alert(1)", "data:text/html,test",
    "ftp://firma.de", "https://name:pass@firma.de", "https://firma.de\\pfad", "https://-firma.de",
    "https://firma..de", "https://firma.de/mit leerzeichen"])("weist %s ab", input => {
    expect(() => normalizeWebsite(input)).toThrow("Bitte eine gültige Website");
  });
});
