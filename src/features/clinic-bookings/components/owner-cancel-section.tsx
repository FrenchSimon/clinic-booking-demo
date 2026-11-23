import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { cancelClinicBooking } from "../actions";
import type { ClinicBooking } from "../queries";

/**
 * The owner cancels any paid booking with a full refund (checklist #13),
 * whenever the session is: a link first, then a second step that says what
 * happens, so one tap never cancels. A cancelled booking whose refund failed
 * gets a button to try again.
 */
export async function OwnerCancelSection({
  booking,
  confirming,
}: {
  booking: ClinicBooking;
  confirming: boolean;
}) {
  const { locale, t } = await getDictionary();
  const c = t.clinic.cancel;
  const price = formatEuros(booking.priceCents, locale);
  if (booking.cancelledAt !== null) {
    return booking.status === "cancelled" ? (
      <CancelForm bookingId={booking.id} label={c.retry} />
    ) : (
      <p className="text-muted-foreground">{fill(c.done, { price })}</p>
    );
  }
  if (booking.status !== "confirmed") return null;
  if (!confirming) {
    return (
      <Link
        href={`/clinic/bookings/${booking.id}?cancel=confirm`}
        className={buttonVariants({
          variant: "danger-outline",
          className: "self-start",
        })}
      >
        {c.open}
      </Link>
    );
  }
  return (
    <section
      aria-labelledby="cancel-title"
      className="flex flex-col gap-4 rounded-[18px] border bg-card p-5 sm:p-8"
    >
      <h2 id="cancel-title" className="font-heading font-semibold text-xl">
        {c.title}
      </h2>
      <p className="text-muted-foreground">{fill(c.explain, { price })}</p>
      <div className="flex flex-wrap items-center gap-3">
        <CancelForm bookingId={booking.id} label={c.confirm} danger />
        <Link
          href={`/clinic/bookings/${booking.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {c.keep}
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
    <form action={cancelClinicBooking}>
      <input type="hidden" name="booking" value={bookingId} />
      <Button type="submit" variant={danger ? "danger" : "default"}>
        {label}
      </Button>
    </form>
  );
}
