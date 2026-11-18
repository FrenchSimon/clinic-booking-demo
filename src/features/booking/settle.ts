import "server-only";
import { after } from "next/server";
import type Stripe from "stripe";
import { deliverEmail } from "@/features/email/outbox";
import { adminDb } from "@/lib/db";
import { queueConfirmationEmail } from "./confirmation";
import {
  type PaidCheckout,
  type Settlement,
  settlePaidCheckout,
} from "./payment";
import { refundLatePayment } from "./stripe-session";

/**
 * Settles a paid Checkout session for the webhook (R2.7) and the return page
 * (R2.8). A confirmed booking queues its confirmation email in the same
 * transaction (checklist #14), sent once the response has gone out.
 * adminDb: both callers checked the payment with Stripe itself, and nobody
 * writes bookings as themselves (see table.ts).
 */
export async function settleAndNotify(
  client: Stripe,
  paid: PaidCheckout,
  origin: string,
): Promise<Settlement> {
  const { result, emailId } = await adminDb.transaction(async (tx) => {
    const result = await settlePaidCheckout(tx, paid, (bookingId, payment) =>
      refundLatePayment(client, bookingId, payment),
    );
    const emailId =
      result === "confirmed"
        ? await queueConfirmationEmail(tx, paid.sessionId, origin)
        : null;
    return { result, emailId };
  });
  // A failed send stays in the outbox as "failed": the booking is kept.
  if (emailId) after(() => deliverEmail(emailId));
  return result;
}
