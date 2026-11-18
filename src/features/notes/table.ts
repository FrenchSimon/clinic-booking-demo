import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Row level security: a user only ever sees and changes their own notes,
// whatever the code above does. Defining a policy enables RLS on the table.
export const notes = pgTable(
  "notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => authUsers.id, { onDelete: "cascade" }),
    body: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    pgPolicy("notes_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
    pgPolicy("notes_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
    pgPolicy("notes_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
  ],
);

export type Note = typeof notes.$inferSelect;
