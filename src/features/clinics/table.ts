import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Row level security: a clinic and its members are only visible to people
// who belong to that clinic, whatever the code above does. The helpers
// private.is_member() and private.has_role() are in drizzle/0001.

export const membershipRole = pgEnum("membership_role", [
  "owner",
  "practitioner",
  "patient",
]);

const owner = (clinicId: unknown) =>
  sql`private.has_role(${clinicId}, array['owner'])`;

export const clinics = pgTable(
  "clinics",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    // Public address of the clinic page, for example /c/maison-tilleul.
    slug: text().notNull(),
    // Deleting the account that created a clinic deletes the clinic too:
    // that is how demo clinics disappear with their anonymous visitor.
    createdBy: uuid("created_by")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("clinics_slug_unique").on(t.slug),
    check(
      "clinics_slug_format",
      sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(${t.slug}) <= 60`,
    ),
    // The creator can read the row right after the insert, before the
    // owner membership added by the trigger in drizzle/0003 is visible.
    pgPolicy("clinics_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.createdBy} = ${authUid} or private.is_member(${t.id})`,
    }),
    pgPolicy("clinics_insert_self", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.createdBy} = ${authUid}`,
    }),
    pgPolicy("clinics_update_owner", {
      for: "update",
      to: authenticatedRole,
      using: owner(t.id),
      withCheck: owner(t.id),
    }),
    pgPolicy("clinics_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: owner(t.id),
    }),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: membershipRole().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One role per person and clinic.
    unique("memberships_clinic_user_unique").on(t.clinicId, t.userId),
    index("memberships_user_idx").on(t.userId),
    // Everyone sees their own membership. Owners and practitioners see the
    // whole clinic. Patients see the staff, never the other patients.
    pgPolicy("memberships_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}
        or private.has_role(${t.clinicId}, array['owner', 'practitioner'])
        or (${t.role} <> 'patient' and private.is_member(${t.clinicId}))`,
    }),
    pgPolicy("memberships_insert_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: owner(t.clinicId),
    }),
    pgPolicy("memberships_update_owner", {
      for: "update",
      to: authenticatedRole,
      using: owner(t.clinicId),
      withCheck: owner(t.clinicId),
    }),
    pgPolicy("memberships_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: owner(t.clinicId),
    }),
  ],
);

export type Clinic = typeof clinics.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type MembershipRole = (typeof membershipRole.enumValues)[number];
