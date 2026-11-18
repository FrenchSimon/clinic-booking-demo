import "server-only";
import { and, eq } from "drizzle-orm";
import { clinics, memberships } from "@/features/clinics/table";
import { services } from "@/features/services/table";
import { withRls } from "@/lib/db";
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
