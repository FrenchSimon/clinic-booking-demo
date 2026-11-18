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
