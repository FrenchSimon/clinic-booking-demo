import "server-only";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { deliverEmail } from "@/features/email/outbox";
import { adminDb, withRls } from "@/lib/db";
import { siteOrigin } from "@/server/site-origin";
import { stripe } from "@/server/stripe";
import { type CancelError, cancelInDb } from "./cancel";
import { queueCancellationEmail } from "./cancellation-email";
import { refundCancelled } from "./stripe-session";
import { bookings } from "./table";

export type CancelOutcome = "refunded" | CancelError | "refund_failed";

/**
 * The patient (checklist #12) or the clinic's owner (#13) cancels a booking,
 * and the patient gets their payment back in full. The booking is cancelled first, so the slot is free even
 * if Stripe fails; asking again then retries the refund only. Once refunded,
 * the patient gets an email (#14), sent after the response has gone out.
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

  const origin = await siteOrigin();
  // adminDb: nobody updates a booking as themselves (see table.ts), and the
  // patient may not write to the outbox. The cancellation went through RLS
  // above, as the patient or the owner, and Stripe has just confirmed the
  // refund. Only the call that marks the booking refunded queues the email.
  const emailId = await adminDb.transaction(async (tx) => {
    const [row] = await tx
      .update(bookings)
      .set({ status: "refunded" })
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, "cancelled")))
      .returning({ id: bookings.id });
    return row ? queueCancellationEmail(tx, row.id, userId, origin) : null;
  });
  // A failed send stays in the outbox as "failed": the refund is kept.
  if (emailId) after(() => deliverEmail(emailId));
  return "refunded";
}
