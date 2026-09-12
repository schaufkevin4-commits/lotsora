import { describe, expect, it } from "vitest";
import { sicheresInternesZiel } from "./redirect";

const requestUrl = "https://lotsora.example/auth/confirm?token_hash=secret";

describe("Auth-Redirect bleibt auf der eigenen Origin", () => {
  it.each([
    null, "", "https://example.invalid", "//example.invalid", "javascript:alert(1)",
    "/\texample.invalid", "/\t/example.invalid", "/\n/example.invalid", "/\r/example.invalid",
    "/\\example.invalid", "\\example.invalid", "/\u0000/example.invalid", "/\u007f/example.invalid",
  ])("verwirft ungültiges/externalisierbares Ziel %j", (next) => {
    expect(sicheresInternesZiel(next, requestUrl).href).toBe("https://lotsora.example/dashboard");
  });

  it.each(["/dashboard", "/passwort-neu", "/produkte?sort=name#liste", "/produkte/%C3%A4"])(
    "erhält internes Ziel %s ohne den Bestätigungstoken", (next) => {
      expect(sicheresInternesZiel(next, requestUrl).href).toBe(`https://lotsora.example${next}`);
    },
  );

  it("interpretiert einen nach Normalisierung doppelten Slash nicht erneut als Host", () => {
    const target = sicheresInternesZiel("/produkt/..//example.invalid", requestUrl);
    expect(target.href).toBe("https://lotsora.example//example.invalid");
    expect(target.origin).toBe("https://lotsora.example");
  });

  it("erhält lokale Origin einschließlich Port", () => {
    expect(sicheresInternesZiel("/passwort-neu", "http://127.0.0.1:3100/auth/confirm").href)
      .toBe("http://127.0.0.1:3100/passwort-neu");
  });
});
