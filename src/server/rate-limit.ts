import "server-only";
import { headers } from "next/headers";

const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * The visitor's IP address. Vercel sets x-forwarded-for itself, so a client
 * cannot choose it. "unknown" when there is none, for example in tests.
 */
export async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * Returns false when the caller made more than `limit` calls in `windowMs`.
 * Counts per server instance: enough to stop a script hammering a form.
 * If real abuse shows up, move the counter to the database or a Vercel firewall rule.
 */
export async function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): Promise<boolean> {
  const id = `${key}:${await clientIp()}`;
  const now = Date.now();
  const entry = hits.get(id);

  if (!entry || entry.resetAt <= now) {
    hits.set(id, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
