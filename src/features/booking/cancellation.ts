import "server-only";
import { and, eq } from "drizzle-orm";
import { adminDb, withRls } from "@/lib/db";
import { stripe } from "@/server/stripe";
import { type CancelError, cancelInDb } from "./cancel";
import { refundCancelled } from "./stripe-session";
import { bookings } from "./table";

export type CancelOutcome = "refunded" | CancelError | "refund_failed";

/**
 * The patient (checklist #12) or the clinic's owner (#13) cancels a booking,
 * and the patient gets their payment back in full. The booking is cancelled first, so the slot is free even
 * if Stripe fails; asking again then retries the refund only.
 */
export async function cancelAndRefund(
  userId: string,
  bookingId: string,
): Promise<CancelOutcome> {
  const client = stripe();
  // Without Stripe there is no refund: keep the booking as it is.
  if (!client) return "refund_failed";

  const cancelled = await withRls(userId, (tx) => cancelInDb(tx, bookingId));
  if ("error" in cancelled) return cancelled.error;

  const refunded = await refundCancelled(
    client,
    bookingId,
    cancelled.paymentIntentId,
  );
  if (!refunded) return "refund_failed";

  // adminDb: nobody updates a booking as themselves (see table.ts). The
  // cancellation went through RLS above, as the patient or the owner, and
  // Stripe has just confirmed the refund.
  await adminDb
    .update(bookings)
    .set({ status: "refunded" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "cancelled")));
  return "refunded";
}
