import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Database tests run with pnpm test:db (vitest.db.config.mts).
    exclude: ["src/**/*.db.test.ts"],
    environment: "node",
  },
});
