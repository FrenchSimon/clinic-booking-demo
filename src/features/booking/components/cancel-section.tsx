import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { cancelMyBooking } from "../actions";
import { canCancel } from "../history";
import type { MyBooking } from "../queries";

/**
 * Cancelling a paid booking (checklist #12): a link first, then a second
 * step that says what happens, so one tap never cancels. A booking the
 * patient cancelled whose refund failed gets a button to try again.
 */
export async function CancelSection({
  booking,
  confirming,
  now,
}: {
  booking: MyBooking;
  confirming: boolean;
  now: Date;
}) {
  const { locale, t: all } = await getDictionary();
  const t = all.booking.mine.cancel;
  const refundPending =
    booking.status === "cancelled" && booking.cancelledAt !== null;
  if (refundPending) {
    return <CancelForm bookingId={booking.id} label={t.retryRefund} />;
  }
  if (booking.status !== "confirmed") return null;
  if (!canCancel(booking, now)) {
    return <p className="text-muted-foreground">{t.tooLate}</p>;
  }
  if (!confirming) {
    return (
      <Link
        href={`/bookings/${booking.id}?cancel=confirm`}
        className={buttonVariants({
          variant: "danger-outline",
          className: "self-start",
        })}
      >
        {t.link}
      </Link>
    );
  }
  return (
    <section
      aria-labelledby="cancel-title"
      className="flex flex-col gap-4 rounded-[18px] border bg-card p-5 sm:p-8"
    >
      <h2 id="cancel-title" className="font-heading font-semibold text-xl">
        {t.title}
      </h2>
      <p className="text-muted-foreground">
        {fill(t.text, { price: formatEuros(booking.priceCents, locale) })}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <CancelForm bookingId={booking.id} label={t.confirm} danger />
        <Link
          href={`/bookings/${booking.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t.keep}
        </Link>
      </div>
    </section>
  );
}

/** "Cancel and refund" is red; "Try the refund again" only finishes it. */
function CancelForm({
  bookingId,
  label,
  danger = false,
}: {
  bookingId: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={cancelMyBooking}>
      <input type="hidden" name="booking" value={bookingId} />
      <Button type="submit" variant={danger ? "danger" : "default"}>
        {label}
      </Button>
    </form>
  );
}
