import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { clinics } from "@/features/clinics/table";

// The outbox: every email is a row before it is sent. The dedupe key makes a
// second "send the reminder for booking X" a no-op instead of a second email,
// and the demo Outbox page (R5.3) shows these rows instead of sending them.

export const emailKind = pgEnum("email_kind", [
  "practitioner_invite",
  "booking_confirmation",
  "booking_reminder",
  "booking_cancellation",
]);

export const emailStatus = pgEnum("email_status", [
  "pending", // queued, not sent yet
  "sending", // claimed by one sender
  "sent",
  "failed",
  "held", // demo clinic: shown in the Outbox, never sent
]);

const owner = (clinicId: unknown) =>
  sql`private.has_role(${clinicId}, array['owner'])`;

export const emails = pgTable(
  "emails",
  {
    id: uuid().primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    kind: emailKind().notNull(),
    // One logical email, for example "booking_reminder:<booking id>".
    dedupeKey: text("dedupe_key").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text().notNull(),
    html: text().notNull(),
    text: text().notNull(),
    status: emailStatus().notNull().default("pending"),
    attempts: integer().notNull().default(0),
    lastError: text("last_error"),
    providerId: text("provider_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [
    unique("emails_dedupe_key_unique").on(t.dedupeKey),
    index("emails_clinic_created_idx").on(t.clinicId, t.createdAt),
    index("emails_status_idx").on(t.status),
    // Owners read their clinic's emails (the Outbox) and queue emails from
    // their own actions. Sending updates status through adminDb only.
    pgPolicy("emails_select_owner", {
      for: "select",
      to: authenticatedRole,
      using: owner(t.clinicId),
    }),
    pgPolicy("emails_insert_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: owner(t.clinicId),
    }),
  ],
);

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type EmailKind = (typeof emailKind.enumValues)[number];
