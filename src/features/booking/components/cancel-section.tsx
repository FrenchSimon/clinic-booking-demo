import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import { cancelMyBooking } from "../actions";
import { canCancel } from "../history";
import type { MyBooking } from "../queries";

// What cancelMyBooking() sends back in ?error= (features/booking/actions.ts).
export const CANCEL_ERRORS: Record<string, string> = {
  too_late:
    "Your session is now less than 24 hours away: it can no longer be cancelled online.",
  not_cancellable: "This booking can no longer be cancelled.",
  refund_failed:
    "The refund could not be made just now. Try again in a moment.",
};

/**
 * Cancelling a paid booking (checklist #12): a link first, then a second
 * step that says what happens, so one tap never cancels. A booking the
 * patient cancelled whose refund failed gets a button to try again.
 */
export function CancelSection({
  booking,
  confirming,
  now,
}: {
  booking: MyBooking;
  confirming: boolean;
  now: Date;
}) {
  const refundPending =
    booking.status === "cancelled" && booking.cancelledAt !== null;
  if (refundPending) {
    return <CancelForm bookingId={booking.id} label="Try the refund again" />;
  }
  if (booking.status !== "confirmed") return null;
  if (!canCancel(booking, now)) {
    return (
      <p className="text-muted-foreground">
        Your session is less than 24 hours away: it can no longer be cancelled
        online. Contact the clinic if you cannot come.
      </p>
    );
  }
  if (!confirming) {
    return (
      <Link
        href={`/bookings/${booking.id}?cancel=confirm`}
        className="flex min-h-11 items-center self-start text-primary underline underline-offset-4"
      >
        Cancel this booking
      </Link>
    );
  }
  return (
    <section
      aria-labelledby="cancel-title"
      className="flex flex-col gap-4 rounded-[18px] border bg-card p-5 sm:p-8"
    >
      <h2 id="cancel-title" className="font-heading font-semibold text-xl">
        Cancel this session?
      </h2>
      <p className="text-muted-foreground">
        The time becomes free for other patients, and{" "}
        {formatEuros(booking.priceCents)} goes back to your card in full. It
        cannot be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <CancelForm bookingId={booking.id} label="Cancel and refund" />
        <Link
          href={`/bookings/${booking.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Keep my booking
        </Link>
      </div>
    </section>
  );
}

function CancelForm({
  bookingId,
  label,
}: {
  bookingId: string;
  label: string;
}) {
  return (
    <form action={cancelMyBooking}>
      <input type="hidden" name="booking" value={bookingId} />
      <Button type="submit">{label}</Button>
    </form>
  );
}
