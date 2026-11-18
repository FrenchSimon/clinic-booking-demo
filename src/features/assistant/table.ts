import { date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

// Questions asked to the assistant, per visitor and per Brussels day
// (checklist #18: 15 a day). The visitor is a hash of their IP address and
// the day, never the address itself, and past days are deleted by the daily
// cleanup job. RLS on and no policy: visitors have no account, so only the
// server writes here, through adminDb.
export const assistantQuestions = pgTable(
  "assistant_questions",
  {
    visitor: text().notNull(),
    day: date({ mode: "string" }).notNull(),
    asked: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.visitor, t.day] })],
);
