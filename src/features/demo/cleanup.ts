import "server-only";
import { sql } from "drizzle-orm";
import { deletePastQuestionCounts } from "@/features/assistant/quota";
import { brusselsToday } from "@/features/availability/schema";
import { isCronRequest } from "@/features/booking/reminders-cron";
import { adminDb } from "@/lib/db";
import { env } from "@/lib/env";

type Db = Pick<typeof adminDb, "execute">;

const DAY = 24 * 3_600_000;

/**
 * Deletes the demo visitors whose 24 hours are over (checklist #19), with the
 * physios and patients seeded for them. Their clinic and everything in it go
 * with them: every table cascades from the clinic or its accounts. Anonymous
 * accounts only exist for the demo, and only seed.ts marks app_metadata.
 * Returns how many accounts were deleted.
 */
export async function deleteExpiredDemos(
  db: Db,
  now = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - DAY);
  const rows = await db.execute(
    sql`delete from auth.users
        where created_at < ${cutoff.toISOString()}::timestamptz
          and (is_anonymous or raw_app_meta_data->>'kinora_demo' = 'true')
        returning id`,
  );
  return rows.length;
}

/**
 * Answers the daily cron call: checks the secret, then deletes the expired
 * demos and the assistant's question counts of past days (checklist #18).
 */
export async function handleDemoCleanupCron(
  request: Request,
): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) return new Response("Cron is not configured", { status: 503 });
  if (!isCronRequest(request.headers.get("authorization"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  // adminDb: a job with no signed-in user, and auth.users is not reachable
  // through row level security, nor is the assistant's count (no policy).
  const deleted = await deleteExpiredDemos(adminDb);
  const questionCounts = await deletePastQuestionCounts(
    adminDb,
    brusselsToday(),
  );
  return Response.json({ deleted, questionCounts });
}
