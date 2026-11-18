import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import type { adminDb } from "@/lib/db";
import { assistantQuestions } from "./table";

type Db = Pick<typeof adminDb, "insert" | "delete">;

/** Questions a visitor may ask per Brussels day (checklist #18). */
export const DAILY_QUESTIONS = 15;

/** Who is asking, without storing their IP address. */
export function visitorKey(ip: string, day: string): string {
  return createHash("sha256").update(`${day}:${ip}`).digest("hex");
}

/**
 * Counts one question and returns false once the visitor has asked their 15
 * for the day. One upsert that stops at the limit: two questions sent at the
 * same moment cannot both take the last place.
 */
export async function takeQuestion(
  db: Db,
  visitor: string,
  day: string,
): Promise<boolean> {
  const rows = await db
    .insert(assistantQuestions)
    .values({ visitor, day, asked: 1 })
    .onConflictDoUpdate({
      target: [assistantQuestions.visitor, assistantQuestions.day],
      set: { asked: sql`${assistantQuestions.asked} + 1` },
      setWhere: sql`${assistantQuestions.asked} < ${DAILY_QUESTIONS}`,
    })
    .returning({ asked: assistantQuestions.asked });
  return rows.length > 0;
}

/** Deletes the counts of the days before `today`. Returns how many. */
export async function deletePastQuestionCounts(
  db: Db,
  today: string,
): Promise<number> {
  const rows = await db
    .delete(assistantQuestions)
    .where(lt(assistantQuestions.day, today))
    .returning({ day: assistantQuestions.day });
  return rows.length;
}
