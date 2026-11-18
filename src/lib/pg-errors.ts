/** True when Postgres refused a write because of this unique constraint or index. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = (
    error as { cause?: { code?: string; constraint_name?: string } }
  )?.cause;
  return cause?.code === "23505" && cause.constraint_name === constraint;
}
