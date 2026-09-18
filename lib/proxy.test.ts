import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, proxy } from "../proxy";

const auth = vi.hoisted(() => ({ user: null as null | { id: string }, refresh: false }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: unknown[]) => void } }) => ({
    auth: { getUser: async () => {
      if (auth.refresh) options.cookies.setAll([{ name: "session", value: "renewed", options: { httpOnly: true } }]);
      return { data: { user: auth.user } };
    } },
  }),
}));

beforeEach(() => { auth.user = null; auth.refresh = false; });
describe("Proxy-Konvention und bestehender Zugriffsschutz", () => {
  it.each(["/dashboard", "/profil", "/produkte", "/produkte/test", "/p/test", "/login"])("prüft %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
  });
  it.each(["/_next/static/chunk.js", "/_next/image", "/favicon.ico", "/logo.svg"])("überspringt %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
  });
  it.each(["/dashboard", "/profil", "/produkte/test"])("leitet Gäste von %s zum Login", async path => {
    const response = await proxy(new NextRequest(`http://localhost${path}`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });
  it("lässt öffentliche Pässe für Gäste durch", async () => {
    expect((await proxy(new NextRequest("http://localhost/p/test"))).headers.get("x-middleware-next")).toBe("1");
  });
  it("lässt angemeldete Hersteller durch und erhält erneuerte Cookies", async () => {
    auth.user = { id: "test" }; auth.refresh = true;
    const request = new NextRequest("http://localhost/produkte/test");
    const response = await proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(request.cookies.get("session")?.value).toBe("renewed");
    expect(response.cookies.get("session")?.value).toBe("renewed");
    expect(response.cookies.get("session")?.httpOnly).toBe(true);
  });
});
