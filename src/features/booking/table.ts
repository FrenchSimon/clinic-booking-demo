import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
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
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";
import { clinics, memberships } from "@/features/clinics/table";
import { services } from "@/features/services/table";

// A booking takes one physio's time for one service. Two bookings that hold
// the slot (pending payment or confirmed) can never overlap for the same
// physio: an exclusion constraint in drizzle/0011 refuses the second one.
//
// No insert, update or delete policy: the Supabase Data API lets a signed-in
// user write directly within the policies, so nobody writes here as
// themselves. Holds go through private.hold_slot() (drizzle/0014), Stripe's
// webhook confirms them (R2.7), and patients cancel through
// private.cancel_booking() (drizzle/0018).

export const bookingStatus = pgEnum("booking_status", [
  "pending_payment", // held for 15 minutes while the patient pays
  "confirmed", // paid
  "expired", // not paid in time: the slot is free again
  "cancelled",
  "refunded",
]);

/** The statuses that take the physio's time. */
export const HOLDING_STATUSES = ["pending_payment", "confirmed"] as const;

export const bookings = pgTable(
  "bookings",
  {
    id: uuid().primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").notNull(),
    membershipId: uuid("membership_id").notNull(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    // The price when booked: changing the service later does not change it.
    priceCents: integer("price_cents").notNull(),
    status: bookingStatus().notNull().default("pending_payment"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    // The Stripe Checkout session that pays this booking (R2.6).
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    // Set by the webhook when Stripe confirms the payment (R2.7).
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    // Set when the patient cancels (R4.1): a refunded booking with this date
    // was cancelled, one without it was paid after its slot was taken.
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Both keys carry the clinic: a booking stays inside one clinic.
    foreignKey({
      name: "bookings_service_fk",
      columns: [t.clinicId, t.serviceId],
      foreignColumns: [services.clinicId, services.id],
    }),
    foreignKey({
      name: "bookings_membership_fk",
      columns: [t.clinicId, t.membershipId],
      foreignColumns: [memberships.clinicId, memberships.id],
    }).onDelete("cascade"),
    index("bookings_clinic_starts_idx").on(t.clinicId, t.startsAt),
    index("bookings_patient_idx").on(t.patientId),
    unique("bookings_checkout_session_unique").on(t.stripeCheckoutSessionId),
    check("bookings_time_order", sql`${t.endsAt} > ${t.startsAt}`),
    check("bookings_price_range", sql`${t.priceCents} between 50 and 100000`),
    check(
      "bookings_hold_expiry",
      sql`${t.status} <> 'pending_payment' or ${t.holdExpiresAt} is not null`,
    ),
    // The patient sees their bookings, the physio their own agenda (#17),
    // the owner the whole clinic.
    pgPolicy("bookings_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.patientId} = ${authUid}
        or exists (select 1 from public.memberships m
          where m.id = ${t.membershipId} and m.user_id = (select auth.uid()))
        or private.has_role(${t.clinicId}, array['owner'])`,
    }),
  ],
);

// Every Stripe event the webhook has handled. Stripe may send an event
// twice: its id is the primary key, so the second delivery changes nothing.
// RLS on and no policy: only the webhook writes here, through adminDb.
export const stripeEvents = pgTable("stripe_events", {
  id: text().primaryKey(),
  type: text().notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type BookingStatus = (typeof bookingStatus.enumValues)[number];
