import "server-only";
import { and, eq } from "drizzle-orm";
import { adminDb, withRls } from "@/lib/db";
import { stripe } from "@/server/stripe";
import { type CancelError, cancelInDb } from "./cancel";
import { refundCancelled } from "./stripe-session";
import { bookings } from "./table";

export type CancelOutcome = "refunded" | CancelError | "refund_failed";

/**
 * The patient cancels their booking and gets their payment back in full
 * (checklist #12). The booking is cancelled first, so the slot is free even
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
  // patient's own cancellation went through RLS above, and Stripe has just
  // confirmed the refund.
  await adminDb
    .update(bookings)
    .set({ status: "refunded" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "cancelled")));
  return "refunded";
}
