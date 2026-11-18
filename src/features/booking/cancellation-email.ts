import "server-only";
import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { clinics, memberships } from "@/features/clinics/table";
import { DEMO_VISITOR_EMAIL, queueEmail } from "@/features/email/outbox";
import { services } from "@/features/services/table";
import { cancellationEmail } from "./email";
import type { Tx } from "./payment";
import { bookings } from "./table";

/**
 * Queues the cancellation and refund email of a booking (checklist #14).
 * Run it in the transaction that marks the booking refunded: the email exists
 * if and only if the refund went through. The dedupe key makes a second call
 * a no-op. Returns the email's id, or null when nothing was queued.
 */
export async function queueCancellationEmail(
  tx: Tx,
  bookingId: string,
  cancelledBy: string,
  origin: string,
): Promise<string | null> {
  const [booking] = await tx
    .select({
      id: bookings.id,
      clinicId: bookings.clinicId,
      patientId: bookings.patientId,
      startsAt: bookings.startsAt,
      priceCents: bookings.priceCents,
      patientEmail: authUsers.email,
      serviceName: services.name,
      physioName: memberships.displayName,
      clinicName: clinics.name,
      clinicAddress: clinics.address,
    })
    .from(bookings)
    .innerJoin(authUsers, eq(authUsers.id, bookings.patientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(clinics, eq(clinics.id, bookings.clinicId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .where(eq(bookings.id, bookingId));
  if (!booking) return null;

  return queueEmail(tx, {
    clinicId: booking.clinicId,
    kind: "booking_cancellation",
    dedupeKey: `booking_cancellation:${booking.id}`,
    to: booking.patientEmail ?? DEMO_VISITOR_EMAIL,
    content: cancellationEmail({
      ...booking,
      byClinic: booking.patientId !== cancelledBy,
      link: `${origin}/bookings/${booking.id}`,
    }),
  });
}
