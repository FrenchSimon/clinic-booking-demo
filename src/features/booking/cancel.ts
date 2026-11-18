import "server-only";
import { sql } from "drizzle-orm";
import type { withRls } from "@/lib/db";

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

export type CancelError = "too_late" | "not_cancellable";

/**
 * Cancels a paid booking through private.cancel_booking(): its patient up
 * to 24 hours before (drizzle/0018, checklist #12), the clinic's owner at
 * any time (drizzle/0019, #13). Returns the payment to refund, or why the
 * booking cannot be cancelled. Runs inside a withRls() transaction, as the
 * user who cancels.
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
