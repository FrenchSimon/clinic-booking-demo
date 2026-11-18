import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { clinics, memberships } from "@/features/clinics/table";
import { services } from "@/features/services/table";
import { withRls } from "@/lib/db";
import { splitBookings } from "./history";
import { bookings } from "./table";

/** One of the patient's own bookings with what the page shows, or null. Read through RLS. */
export async function getMyBooking(userId: string, bookingId: string) {
  const [row] = await withRls(userId, (tx) =>
    tx
      .select({
        id: bookings.id,
        status: bookings.status,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        priceCents: bookings.priceCents,
        stripeCheckoutSessionId: bookings.stripeCheckoutSessionId,
        cancelledAt: bookings.cancelledAt,
        serviceName: services.name,
        physioName: memberships.displayName,
        clinicName: clinics.name,
        clinicSlug: clinics.slug,
        clinicAddress: clinics.address,
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(clinics, eq(clinics.id, bookings.clinicId))
      .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
      .where(and(eq(bookings.id, bookingId), eq(bookings.patientId, userId))),
  );
  return row ?? null;
}

export type MyBooking = NonNullable<Awaited<ReturnType<typeof getMyBooking>>>;

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

/** Every booking of this patient, never-paid holds aside. Runs inside a withRls() transaction. */
export function myBookings(tx: Tx, userId: string) {
  return tx
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      holdExpiresAt: bookings.holdExpiresAt,
      serviceName: services.name,
      physioName: memberships.displayName,
      clinicName: clinics.name,
      clinicSlug: clinics.slug,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(clinics, eq(clinics.id, bookings.clinicId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .where(and(eq(bookings.patientId, userId), ne(bookings.status, "expired")));
}

/** The signed-in patient's upcoming and past bookings (checklist #11). Read through RLS. */
export async function listMyBookings(userId: string, now = new Date()) {
  const rows = await withRls(userId, (tx) => myBookings(tx, userId));
  return splitBookings(rows, now);
}

export type MyBookingItem = Awaited<ReturnType<typeof myBookings>>[number];
