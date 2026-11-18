// Checklist #18: a visitor asks the assistant at most 15 questions a Brussels
// day, counted on the server, even when questions arrive at the same moment.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import {
  DAILY_QUESTIONS,
  deletePastQuestionCounts,
  takeQuestion,
  visitorKey,
} from "@/features/assistant/quota";
import { assistantQuestions } from "@/features/assistant/table";
import { closeTestDb, rolledBack, type Tx, testDb } from "./test-support";

afterAll(closeTestDb);

// Far from any real day, so the cleanup job never meets these rows.
const DAY = "2030-03-05";

async function ask(tx: Tx, visitor: string, times: number, day = DAY) {
  const answers: boolean[] = [];
  for (let i = 0; i < times; i++) {
    answers.push(await takeQuestion(tx, visitor, day));
  }
  return answers;
}

describe("assistant quota", () => {
  it("allows 15 questions a day, then refuses", async () => {
    await rolledBack(async (tx) => {
      const answers = await ask(tx, randomUUID(), DAILY_QUESTIONS + 2);
      expect(answers.filter(Boolean)).toHaveLength(DAILY_QUESTIONS);
      expect(answers.slice(DAILY_QUESTIONS)).toEqual([false, false]);
    });
  });

  it("counts each visitor and each day apart", async () => {
    await rolledBack(async (tx) => {
      const visitor = randomUUID();
      await ask(tx, visitor, DAILY_QUESTIONS);
      expect(await takeQuestion(tx, visitor, DAY)).toBe(false);
      expect(await takeQuestion(tx, randomUUID(), DAY)).toBe(true);
      expect(await takeQuestion(tx, visitor, "2030-03-06")).toBe(true);
    });
  });

  it("never stores the IP address", () => {
    const key = visitorKey("203.0.113.7", DAY);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(visitorKey("203.0.113.7", "2030-03-06")).not.toBe(key);
  });

  it("deletes the days before today only", async () => {
    await rolledBack(async (tx) => {
      const visitor = randomUUID();
      await takeQuestion(tx, visitor, "2030-03-04");
      await takeQuestion(tx, visitor, DAY);
      // Other days in the database may be deleted too: count ours only.
      await deletePastQuestionCounts(tx, DAY);
      const left = await tx
        .select({ day: assistantQuestions.day })
        .from(assistantQuestions)
        .where(eq(assistantQuestions.visitor, visitor));
      expect(left).toEqual([{ day: DAY }]);
    });
  });

  it("gives the last place to one of two questions sent together", async () => {
    // Real concurrency needs two connections and committed rows, so this
    // test commits its count and deletes it after.
    const visitor = randomUUID();
    const url = process.env.DATABASE_URL ?? "";
    const clients = [0, 1].map(() =>
      postgres(url, { prepare: false, max: 1, onnotice: () => {} }),
    );
    try {
      await testDb.transaction((tx) => ask(tx, visitor, DAILY_QUESTIONS - 1));
      // Each question takes its place, then waits before committing, so the
      // two overlap in time.
      const questions = clients.map((client) =>
        drizzle({ client, schema }).transaction(async (tx) => {
          const allowed = await takeQuestion(tx, visitor, DAY);
          await tx.execute(sql`select pg_sleep(0.5)`);
          return allowed;
        }),
      );
      expect((await Promise.all(questions)).sort()).toEqual([false, true]);
    } finally {
      await Promise.all(clients.map((c) => c.end()));
      await testDb
        .delete(assistantQuestions)
        .where(eq(assistantQuestions.visitor, visitor));
    }
  });
});
