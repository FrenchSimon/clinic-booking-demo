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

/** The headline, telling a patient's own cancellation from a late payment. */
function headline(booking: MyBooking) {
  if (booking.cancelledAt === null) return HEADLINES[booking.status];
  if (booking.status === "refunded") {
    return {
      title: "Your booking is cancelled",
      text: `We refunded ${formatEuros(booking.priceCents)} in full. It reaches your card in a few days.`,
    };
  }
  return {
    title: "Your booking is cancelled",
    text: "Your refund has not gone through yet. Try again below, or contact the clinic.",
  };
}

/**
 * Which email the patient was just sent, shown once after paying or
 * cancelling. In a demo clinic (`to` null) it waits in the Outbox instead.
 */
export type EmailNotice = { kind: "booked" | "cancelled"; to: string | null };

// "On its way", not "sent": the email goes out after this page, and may fail.
const NOTICES: Record<EmailNotice["kind"], string> = {
  booked: "A confirmation is on its way to",
  cancelled: "A confirmation of the cancellation and refund is on its way to",
};

/** The patient's booking: what, when, where, and what happens next. */
export function BookingReceipt({
  booking,
  notice,
}: {
  booking: MyBooking;
  notice?: EmailNotice;
}) {
  const { title, text } = headline(booking);
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
        {notice && <EmailLine notice={notice} />}
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

// A demo sends no email (checklist #21): it points to the Outbox instead.
const DEMO_NOTICES: Record<EmailNotice["kind"], string> = {
  booked: "Your confirmation email is in the",
  cancelled: "Your cancellation and refund email is in the",
};

function EmailLine({ notice }: { notice: EmailNotice }) {
  if (notice.to === null) {
    return (
      <p className="text-muted-foreground">
        {DEMO_NOTICES[notice.kind]}{" "}
        <Link
          href="/outbox"
          className="text-primary underline underline-offset-4"
        >
          Outbox
        </Link>
        : no real email leaves a demo clinic.
      </p>
    );
  }
  return (
    <p className="text-muted-foreground">
      {NOTICES[notice.kind]}{" "}
      {/* The address moves to the next line whole, not cut at a dash. */}
      <span className="inline-block max-w-full break-all text-foreground">
        {notice.to}.
      </span>
    </p>
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
