import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/db/schema";
import { isExclusionViolation } from "@/lib/pg-errors";
import { bookings, stripeEvents } from "./table";

// What the webhook does with a paid Checkout session (checklist #10). It
// runs in the caller's transaction, so the event is recorded if and only if
// the booking was settled: a failure lets Stripe retry the same event.

type Tx = Parameters<
  Parameters<PostgresJsDatabase<typeof schema>["transaction"]>[0]
>[0];

export type PaidCheckout = {
  eventId: string;
  eventType: string;
  sessionId: string;
  paymentIntentId: string;
};

export type Settlement =
  | "duplicate" // this event was already handled
  | "unknown_session" // not a Kinora booking
  | "already_settled" // another event confirmed it first
  | "confirmed"
  | "refunded"; // paid after the hold ran out, and the slot was taken

/**
 * Confirms the booking a paid session belongs to, once. A payment that
 * arrives after its 15-minute hold ran out is confirmed if the slot is still
 * free, and refunded in full if someone else booked it meanwhile.
 */
export async function settlePaidCheckout(
  tx: Tx,
  paid: PaidCheckout,
  refund: (bookingId: string, paymentIntentId: string) => Promise<void>,
): Promise<Settlement> {
  const [fresh] = await tx
    .insert(stripeEvents)
    .values({ id: paid.eventId, type: paid.eventType })
    .onConflictDoNothing()
    .returning({ id: stripeEvents.id });
  if (!fresh) return "duplicate";

  // Locks the row: two events for the same session settle one at a time.
  const [booking] = await tx
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(eq(bookings.stripeCheckoutSessionId, paid.sessionId))
    .for("update");
  if (!booking) return "unknown_session";
  if (booking.status !== "pending_payment" && booking.status !== "expired") {
    return "already_settled";
  }

  return confirmOrRefund(tx, booking.id, paid.paymentIntentId, refund);
}

async function confirmOrRefund(
  tx: Tx,
  bookingId: string,
  paymentIntentId: string,
  refund: (bookingId: string, paymentIntentId: string) => Promise<void>,
): Promise<"confirmed" | "refunded"> {
  const payment = {
    stripePaymentIntentId: paymentIntentId,
    paidAt: new Date(),
  };
  try {
    // A savepoint: a refused confirmation must not undo the event row.
    await tx.transaction((sp) =>
      sp
        .update(bookings)
        .set({ status: "confirmed", ...payment })
        .where(eq(bookings.id, bookingId)),
    );
    return "confirmed";
  } catch (error) {
    if (!isExclusionViolation(error)) throw error;
  }
  await refund(bookingId, paymentIntentId);
  await tx
    .update(bookings)
    .set({ status: "refunded", ...payment })
    .where(eq(bookings.id, bookingId));
  return "refunded";
}
