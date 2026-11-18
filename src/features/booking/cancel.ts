import "server-only";
import { sql } from "drizzle-orm";
import type { withRls } from "@/lib/db";

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

export type CancelError = "too_late" | "not_cancellable";

/**
 * Cancels the patient's own paid booking through private.cancel_booking()
 * (drizzle/0018), which checks the 24-hour rule (checklist #12). Returns the
 * payment to refund, or why the booking cannot be cancelled. Runs inside a
 * withRls() transaction, as the patient.
 */
export async function cancelInDb(
  tx: Tx,
  bookingId: string,
): Promise<{ paymentIntentId: string } | { error: CancelError }> {
  try {
    // A savepoint: a refusal leaves the caller's transaction usable.
    const rows = await tx.transaction((sp) =>
      sp.execute<{ payment: string }>(
        sql`select private.cancel_booking(${bookingId}) as payment`,
      ),
    );
    const paymentIntentId = rows[0]?.payment;
    if (!paymentIntentId) throw new Error("No payment to refund");
    return { paymentIntentId };
  } catch (error) {
    const reason = cancelError(error);
    if (!reason) throw error;
    return { error: reason };
  }
}

function cancelError(error: unknown): CancelError | null {
  let current = error;
  while (current instanceof Error) {
    if ("code" in current && current.code === "P0001") {
      return current.message === "too_late" ? "too_late" : "not_cancellable";
    }
    current = current.cause;
  }
  return null;
}
