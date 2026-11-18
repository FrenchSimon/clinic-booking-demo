import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import type { OpeningHours } from "@/features/clinics/schema";
import { memberships } from "@/features/clinics/table";

// When each physio works: one weekly schedule, plus days off. A physio
// writes only their own rows; the owner reads them all. Other physios and
// patients see none: free slots are computed on the server (R2.3).

/** The row belongs to the signed-in physio. */
const self = (clinicId: unknown, membershipId: unknown) =>
  sql`exists (select 1 from public.memberships m
    where m.id = ${membershipId} and m.clinic_id = ${clinicId}
      and m.user_id = (select auth.uid()) and m.role = 'practitioner')`;
const selfOrOwner = (clinicId: unknown, membershipId: unknown) =>
  sql`${self(clinicId, membershipId)} or private.has_role(${clinicId}, array['owner'])`;

export const practitionerHours = pgTable(
  "practitioner_hours",
  {
    membershipId: uuid("membership_id").primaryKey(),
    clinicId: uuid("clinic_id").notNull(),
    // Same shape as the clinic's opening hours, checked by openingHoursSchema.
    weeklyHours: jsonb("weekly_hours").$type<OpeningHours>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "practitioner_hours_membership_fk",
      columns: [t.clinicId, t.membershipId],
      foreignColumns: [memberships.clinicId, memberships.id],
    }).onDelete("cascade"),
    check(
      "practitioner_hours_days",
      sql`jsonb_typeof(${t.weeklyHours}) = 'object' and ${t.weeklyHours} ?& array['mon','tue','wed','thu','fri','sat','sun']`,
    ),
    pgPolicy("practitioner_hours_select", {
      for: "select",
      to: authenticatedRole,
      using: selfOrOwner(t.clinicId, t.membershipId),
    }),
    pgPolicy("practitioner_hours_insert_self", {
      for: "insert",
      to: authenticatedRole,
      withCheck: self(t.clinicId, t.membershipId),
    }),
    pgPolicy("practitioner_hours_update_self", {
      for: "update",
      to: authenticatedRole,
      using: self(t.clinicId, t.membershipId),
      withCheck: self(t.clinicId, t.membershipId),
    }),
  ],
);

export const daysOff = pgTable(
  "days_off",
  {
    id: uuid().primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id").notNull(),
    membershipId: uuid("membership_id").notNull(),
    // Both days included, in Europe/Brussels.
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "days_off_membership_fk",
      columns: [t.clinicId, t.membershipId],
      foreignColumns: [memberships.clinicId, memberships.id],
    }).onDelete("cascade"),
    index("days_off_membership_idx").on(t.membershipId, t.endsOn),
    check(
      "days_off_range",
      sql`${t.endsOn} >= ${t.startsOn} and ${t.endsOn} - ${t.startsOn} < 366`,
    ),
    pgPolicy("days_off_select", {
      for: "select",
      to: authenticatedRole,
      using: selfOrOwner(t.clinicId, t.membershipId),
    }),
    pgPolicy("days_off_insert_self", {
      for: "insert",
      to: authenticatedRole,
      withCheck: self(t.clinicId, t.membershipId),
    }),
    pgPolicy("days_off_delete_self", {
      for: "delete",
      to: authenticatedRole,
      using: self(t.clinicId, t.membershipId),
    }),
  ],
);

export type DayOff = typeof daysOff.$inferSelect;
