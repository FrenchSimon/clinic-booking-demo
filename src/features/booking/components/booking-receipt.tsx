import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import type { MyBooking } from "../queries";
import { StatusPill } from "./status-pill";

const when = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Brussels",
});

const HEADLINES: Record<MyBooking["status"], { title: string; text: string }> =
  {
    confirmed: {
      title: "Your session is booked",
      text: "Paid by card. You can cancel online up to 24 hours before for a full refund.",
    },
    pending_payment: {
      title: "We are confirming your payment",
      text: "This usually takes a few seconds.",
    },
    expired: {
      title: "This booking was not paid in time",
      text: "The time was held for 15 minutes. Pick a time again to book.",
    },
    refunded: {
      title: "This time was taken while you paid",
      text: "We refunded your payment in full. It reaches your card in a few days.",
    },
    cancelled: {
      title: "This booking is cancelled",
      text: "Pick another time if you would like to come in.",
    },
  };

/** The patient's booking: what, when, where, and what happens next. */
export function BookingReceipt({ booking }: { booking: MyBooking }) {
  const { title, text } = HEADLINES[booking.status];
  const rows = [
    ["Session", booking.serviceName],
    ["Physio", booking.physioName ?? "Physio"],
    ["When", when.format(booking.startsAt)],
    ["Where", booking.clinicAddress],
    ["Price", formatEuros(booking.priceCents)],
  ];
  return (
    <div className="flex flex-col gap-5 rounded-[18px] border bg-card p-5 sm:p-8">
      <div className="flex flex-col items-start gap-2">
        <StatusPill status={booking.status} />
        <h1 className="font-heading font-normal text-3xl">{title}</h1>
        <p className="text-muted-foreground">{text}</p>
      </div>
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-6 border-divider border-b py-2.5 last:border-b-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <NextStep booking={booking} />
    </div>
  );
}

/** Reload while the payment is confirmed; otherwise back to the clinic's page. */
function NextStep({ booking }: { booking: MyBooking }) {
  if (booking.status === "pending_payment") {
    return (
      <Link
        href={`/bookings/${booking.id}`}
        className={buttonVariants({ className: "self-start" })}
      >
        Reload
      </Link>
    );
  }
  const confirmed = booking.status === "confirmed";
  return (
    <Link
      href={`/c/${booking.clinicSlug}`}
      className={buttonVariants({
        variant: confirmed ? "outline" : "default",
        className: "self-start",
      })}
    >
      {confirmed ? "Book another session" : "Pick a time"}
    </Link>
  );
}
