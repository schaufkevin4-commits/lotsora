import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: vi.fn(() => ({})) }));
vi.mock("@/lib/services/products", () => ({ getOeffentlicherPass: vi.fn() }));
import { getOeffentlicherPass } from "@/lib/services/products";
import { ladeOeffentlichenPass } from "./public-pass";

afterEach(() => vi.restoreAllMocks());
describe("öffentlicher Fehlervertrag", () => {
  it("unterscheidet Nichtexistenz von Ausfall und erholt sich beim nächsten Abruf", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const load = vi.mocked(getOeffentlicherPass);
    load.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("Geheimnis")).mockResolvedValueOnce(null);
    expect(await ladeOeffentlichenPass("7Kf3mQ9xT2Wp")).toEqual({ status: "nicht-verfuegbar" });
    expect(await ladeOeffentlichenPass("7Kf3mQ9xT2Wp")).toEqual({ status: "fehler" });
    expect(await ladeOeffentlichenPass("7Kf3mQ9xT2Wp")).toEqual({ status: "nicht-verfuegbar" });
    // Dies ist kein React-Rendercachetest: echte HTTP-Abnahme separat.
  });
});
