// Database test helpers, used only by the *.db.test.ts files (pnpm test:db).
// Each test runs inside one transaction that is rolled back at the end, so the
// test users and clinics never stay in the database.
import { sql, TransactionRollbackError } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { expect } from "vitest";
import * as schema from "@/db/schema";

// Vitest runs outside Next.js, so load .env.local ourselves.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the shell environment (CI).
}

const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("DATABASE_URL is missing: copy .env.example to .env.local");

const client = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

// Connects as the database owner, like adminDb: the setup bypasses RLS on purpose.
export const testDb = drizzle({ client, schema });

export type Tx = Parameters<Parameters<typeof testDb.transaction>[0]>[0];

export function closeTestDb() {
  return client.end();
}

/** Runs the test in a transaction that is always rolled back. */
export async function rolledBack(run: (tx: Tx) => Promise<void>) {
  try {
    await testDb.transaction(async (tx) => {
      await run(tx);
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) throw error;
  }
}

/**
 * Runs queries as a signed-in user, the same way withRls() does, inside a
 * savepoint: a refused write only undoes itself, not the whole test.
 */
export function asUser<T>(
  tx: Tx,
  userId: string,
  run: (tx: Tx) => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify({ sub: userId, role: "authenticated" });
  return tx.transaction(async (sp) => {
    await sp.execute(
      sql`select set_config('request.jwt.claims', ${claims}, true)`,
    );
    await sp.execute(sql`set local role authenticated`);
    const result = await run(sp);
    await sp.execute(sql`reset role`);
    await sp.execute(sql`select set_config('request.jwt.claims', '', true)`);
    return result;
  });
}

/** The single row an insert returned. */
export function one<T>(rows: T[]): T {
  const [row] = rows;
  if (!row) throw new Error("Expected one row, got none");
  return row;
}

/** Expects Postgres to refuse the write with a row level security error. */
export async function expectDenied(
  tx: Tx,
  userId: string,
  run: (tx: Tx) => Promise<unknown>,
) {
  const error = await asUser(tx, userId, run).then(
    () => null,
    (e: unknown) => e,
  );
  expect(postgresCode(error)).toBe("42501");
}

// Drizzle wraps the Postgres error: look for its SQLSTATE code in the causes.
function postgresCode(error: unknown): string | undefined {
  let current = error;
  while (current instanceof Error) {
    if ("code" in current && typeof current.code === "string")
      return current.code;
    current = current.cause;
  }
  return undefined;
}
