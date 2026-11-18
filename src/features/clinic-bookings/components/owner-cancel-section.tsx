import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import { cancelClinicBooking } from "../actions";
import type { ClinicBooking } from "../queries";

// What cancelClinicBooking() sends back in ?error= (../actions.ts).
export const OWNER_CANCEL_ERRORS: Record<string, string> = {
  not_cancellable: "This booking can no longer be cancelled.",
  refund_failed:
    "The booking is cancelled, but the refund could not be made just now. Try again in a moment.",
};

/**
 * The owner cancels any paid booking with a full refund (checklist #13),
 * whenever the session is: a link first, then a second step that says what
 * happens, so one tap never cancels. A cancelled booking whose refund failed
 * gets a button to try again.
 */
export function OwnerCancelSection({
  booking,
  confirming,
}: {
  booking: ClinicBooking;
  confirming: boolean;
}) {
  const price = formatEuros(booking.priceCents);
  if (booking.cancelledAt !== null) {
    return booking.status === "cancelled" ? (
      <CancelForm bookingId={booking.id} label="Try the refund again" />
    ) : (
      <p className="text-muted-foreground">
        Cancelled, {price} refunded to the patient in full.
      </p>
    );
  }
  if (booking.status !== "confirmed") return null;
  if (!confirming) {
    return (
      <Link
        href={`/clinic/bookings/${booking.id}?cancel=confirm`}
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
        The time becomes free again, and the patient gets {price} back on their
        card in full. It cannot be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <CancelForm bookingId={booking.id} label="Cancel and refund" />
        <Link
          href={`/clinic/bookings/${booking.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Keep the booking
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
    <form action={cancelClinicBooking}>
      <input type="hidden" name="booking" value={bookingId} />
      <Button type="submit">{label}</Button>
    </form>
  );
}
