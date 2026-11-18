import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { sendTomorrowsReminders } from "./reminders";

// Hashing both sides gives equal lengths, so the comparison takes the same
// time whatever the token: it leaks nothing about the secret.
const digest = (value: string) => createHash("sha256").update(value).digest();

/** True when the request carries Vercel's "Authorization: Bearer <CRON_SECRET>". */
export function isCronRequest(header: string | null, secret: string): boolean {
  if (!header) return false;
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

/** Answers the daily cron call: checks the secret, then sends the reminders. */
export async function handleRemindersCron(request: Request): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) return new Response("Cron is not configured", { status: 503 });
  if (!isCronRequest(request.headers.get("authorization"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  // The emails link to the site Vercel called.
  const origin = new URL(request.url).origin;
  const result = await sendTomorrowsReminders(new Date(), origin);
  return Response.json(result);
}
