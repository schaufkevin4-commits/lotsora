import { defineConfig } from "vitest/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // `@/…` genauso auflösen wie in Next (tsconfig paths).
  resolve: { alias: { "@": root } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});