import { describe, expect, it } from "vitest";
import { isValidPublicId } from "./public-id";

describe("isValidPublicId", () => {
  it("akzeptiert eine 12-stellige Base58-ID", () => {
    expect(isValidPublicId("7Kf3mQ9xT2Wp")).toBe(true);
  });

  it("weist interne UUIDs und falsche Längen ab", () => {
    expect(isValidPublicId("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
    expect(isValidPublicId("7Kf3mQ9xT2W")).toBe(false);
  });

  it("weist die mehrdeutigen Zeichen 0, O, I und l ab", () => {
    for (const ambiguous of ["0", "O", "I", "l"]) {
      expect(isValidPublicId(`7Kf3mQ9xT2W${ambiguous}`)).toBe(false);
    }
  });
});
