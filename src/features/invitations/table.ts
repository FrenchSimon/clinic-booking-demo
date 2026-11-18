import { sql } from "drizzle-orm";
import {
  check,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";
import { clinics } from "@/features/clinics/table";

// An owner invites a physio by email. The link carries a random token; the
// database only keeps its SHA-256, so a leaked table cannot be turned into
// working links. Accepting goes through private.accept_invitation() (drizzle/0007).

const owner = (clinicId: unknown) =>
  sql`private.has_role(${clinicId}, array['owner'])`;

export const invitations = pgTable(
  "invitations",
  {
    id: uuid().primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    name: text().notNull(),
    email: text().notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '7 days'`),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: uuid("accepted_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    unique("invitations_token_hash_unique").on(t.tokenHash),
    // One open invitation per person and clinic.
    uniqueIndex("invitations_open_email_unique")
      .on(t.clinicId, t.email)
      .where(sql`${t.acceptedAt} is null`),
    check("invitations_email_lowercase", sql`${t.email} = lower(${t.email})`),
    pgPolicy("invitations_select_owner", {
      for: "select",
      to: authenticatedRole,
      using: owner(t.clinicId),
    }),
    pgPolicy("invitations_insert_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${owner(t.clinicId)} and ${t.invitedBy} = ${authUid}`,
    }),
    pgPolicy("invitations_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: owner(t.clinicId),
    }),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
