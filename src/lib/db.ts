import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

// Supabase transaction pooler: prepared statements are not supported.
const client = postgres(env.DATABASE_URL, { prepare: false });

/** Bypasses row level security. Use only for migrations, webhooks and jobs, with a comment saying why. */
export const adminDb = drizzle({ client, schema });

type Tx = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];

/** Runs queries as the signed-in user, so Postgres row level security applies. */
export function withRls<T>(
  userId: string,
  run: (tx: Tx) => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify({ sub: userId, role: "authenticated" });
  return adminDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${claims}, true)`,
    );
    await tx.execute(sql`set local role authenticated`);
    return run(tx);
  });
}
