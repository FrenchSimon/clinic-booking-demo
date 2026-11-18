import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { clinics, memberships } from "@/features/clinics/table";

// What a clinic sells: a session type with its length and price, and the
// physios who offer it. Everyone in the clinic reads them; only the owner
// changes them. Prices are in euro cents, durations in minutes.

const owner = (clinicId: unknown) =>
  sql`private.has_role(${clinicId}, array['owner'])`;
const member = (clinicId: unknown) => sql`private.is_member(${clinicId})`;

export const services = pgTable(
  "services",
  {
    id: uuid().primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    name: text().notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    // A hidden service stays on past bookings but cannot be booked any more.
    active: boolean().notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Target of the composite foreign key below: a link stays in one clinic.
    unique("services_clinic_id_unique").on(t.clinicId, t.id),
    uniqueIndex("services_clinic_name_unique").on(
      t.clinicId,
      sql`lower(${t.name})`,
    ),
    check(
      "services_duration_range",
      sql`${t.durationMinutes} between 10 and 240 and ${t.durationMinutes} % 5 = 0`,
    ),
    // Stripe refuses card payments under €0.50.
    check("services_price_range", sql`${t.priceCents} between 50 and 100000`),
    pgPolicy("services_select_member", {
      for: "select",
      to: authenticatedRole,
      using: member(t.clinicId),
    }),
    pgPolicy("services_insert_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: owner(t.clinicId),
    }),
    pgPolicy("services_update_owner", {
      for: "update",
      to: authenticatedRole,
      using: owner(t.clinicId),
      withCheck: owner(t.clinicId),
    }),
    pgPolicy("services_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: owner(t.clinicId),
    }),
  ],
);

export const servicePractitioners = pgTable(
  "service_practitioners",
  {
    clinicId: uuid("clinic_id").notNull(),
    serviceId: uuid("service_id").notNull(),
    membershipId: uuid("membership_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.serviceId, t.membershipId] }),
    // Both keys carry the clinic: a service cannot list another clinic's physio.
    foreignKey({
      name: "service_practitioners_service_fk",
      columns: [t.clinicId, t.serviceId],
      foreignColumns: [services.clinicId, services.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "service_practitioners_membership_fk",
      columns: [t.clinicId, t.membershipId],
      foreignColumns: [memberships.clinicId, memberships.id],
    }).onDelete("cascade"),
    pgPolicy("service_practitioners_select_member", {
      for: "select",
      to: authenticatedRole,
      using: member(t.clinicId),
    }),
    // Only physios offer services, never the owner or a patient.
    pgPolicy("service_practitioners_insert_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${owner(t.clinicId)} and exists (
        select 1 from public.memberships m
        where m.id = ${t.membershipId} and m.role = 'practitioner')`,
    }),
    pgPolicy("service_practitioners_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: owner(t.clinicId),
    }),
  ],
);

export type Service = typeof services.$inferSelect;
