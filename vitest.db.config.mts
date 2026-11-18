import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Database tests (pnpm test:db): they need a real Supabase database, so they
// stay out of pnpm test and the pre-commit hook.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.db.test.ts"],
    environment: "node",
    // One shared connection: run the files one after the other.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
