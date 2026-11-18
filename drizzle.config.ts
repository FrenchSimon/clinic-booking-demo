import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load .env.local ourselves.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the shell environment (CI, Vercel).
}

const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("DATABASE_URL is missing: copy .env.example to .env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  // Supabase owns the auth schema and the roles: only manage public tables.
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
  strict: true,
  verbose: true,
});
