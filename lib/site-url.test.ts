import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl, SiteUrlFehler } from "./site-url";

afterEach(() => { vi.unstubAllEnvs(); });

describe("Website-Adresse für Einladungen und Auth-Mails", () => {
  it.each([
    ["https://lotsora.example", "https://lotsora.example"],
    [" https://lotsora.example/ ", "https://lotsora.example"],
    ["http://127.0.0.1:3109/", "http://127.0.0.1:3109"],
  ])("normalisiert %s ohne doppelte Pfadtrenner", (input, expected) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", input);
    expect(getSiteUrl()).toBe(expected);
  });

  it.each([
    undefined, "", "  ", "lotsora.example", "/einladung", "//lotsora.example",
    "https:", "https:lotsora.example", "https://", "ftp://lotsora.example",
    "javascript:alert(1)", "https://user:password@lotsora.example",
    "https://lotsora.example/app", "https://lotsora.example?next=x", "https://lotsora.example#x",
  ])("verwirft unbrauchbare Konfiguration %s", (input) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", input);
    expect(() => getSiteUrl()).toThrow(SiteUrlFehler);
  });
});
