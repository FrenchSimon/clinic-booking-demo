import "server-only";
import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { clinics, memberships } from "@/features/clinics/table";
import { patientLocale, storedLocale } from "@/features/email/locale";
import { DEMO_VISITOR_EMAIL, queueEmail } from "@/features/email/outbox";
import { services } from "@/features/services/table";
import { confirmationEmail } from "./email";
import type { Tx } from "./payment";
import { bookings } from "./table";

/**
 * Queues the confirmation email of the booking a Checkout session paid.
 * Run it in the transaction that confirms the booking: the email exists if
 * and only if the booking was confirmed. The dedupe key makes a second call
 * a no-op. Returns the email's id, or null when nothing was queued.
 */
export async function queueConfirmationEmail(
  tx: Tx,
  sessionId: string,
  origin: string,
): Promise<string | null> {
  const [booking] = await tx
    .select({
      id: bookings.id,
      clinicId: bookings.clinicId,
      startsAt: bookings.startsAt,
      priceCents: bookings.priceCents,
      patientEmail: authUsers.email,
      serviceName: services.name,
      physioName: memberships.displayName,
      clinicName: clinics.name,
      clinicAddress: clinics.address,
      locale: storedLocale,
    })
    .from(bookings)
    .innerJoin(authUsers, eq(authUsers.id, bookings.patientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(clinics, eq(clinics.id, bookings.clinicId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .where(eq(bookings.stripeCheckoutSessionId, sessionId));
  if (!booking) return null;

  return queueEmail(tx, {
    clinicId: booking.clinicId,
    kind: "booking_confirmation",
    dedupeKey: `booking_confirmation:${booking.id}`,
    to: booking.patientEmail ?? DEMO_VISITOR_EMAIL,
    content: confirmationEmail({
      ...booking,
      locale: patientLocale(booking.locale),
      link: `${origin}/bookings/${booking.id}`,
    }),
  });
}
