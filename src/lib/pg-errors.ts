/** True when Postgres refused a write because of this unique constraint or index. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = (
    error as { cause?: { code?: string; constraint_name?: string } }
  )?.cause;
  return cause?.code === "23505" && cause.constraint_name === constraint;
}

/** True when Postgres refused a write because of an exclusion constraint (SQLSTATE 23P01). */
export function isExclusionViolation(error: unknown): boolean {
  let current = error;
  while (current instanceof Error) {
    if ("code" in current && current.code === "23P01") return true;
    current = current.cause;
  }
  return false;
}

/** True when Postgres ended the transaction to break a deadlock (SQLSTATE 40P01). */
export function isDeadlock(error: unknown): boolean {
  let current = error;
  while (current instanceof Error) {
    if ("code" in current && current.code === "40P01") return true;
    current = current.cause;
  }
  return false;
}

/**
 * Runs the transaction again, once, if Postgres ended it to break a deadlock:
 * the retry sees the other transaction's committed result, as the Postgres
 * docs advise. Any other error, or a second deadlock, is thrown.
 */
export async function retryOnDeadlock<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isDeadlock(error)) throw error;
    return run();
  }
}
