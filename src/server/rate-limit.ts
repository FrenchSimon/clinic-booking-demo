import "server-only";
import { headers } from "next/headers";

const hits = new Map<string, { count: number; resetAt: number }>();

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
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const entry = hits.get(id);

  if (!entry || entry.resetAt <= now) {
    hits.set(id, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
