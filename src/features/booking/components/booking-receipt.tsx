import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { dateFormat } from "@/i18n/format";
import { fill, type Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import type { MyBooking } from "../queries";
import { EmailCallout, type EmailNotice } from "./email-notice";
import { StatusPill } from "./status-pill";

type Strings = Dictionary["booking"]["mine"];

/** The headline, telling a patient's own cancellation from a late payment. */
function headline(booking: MyBooking, t: Strings, locale: Locale) {
  if (booking.cancelledAt === null) return t.headlines[booking.status];
  if (booking.status === "refunded") {
    return {
      title: t.cancelledTitle,
      text: fill(t.cancelledRefunded, {
        price: formatEuros(booking.priceCents, locale),
      }),
    };
  }
  return { title: t.cancelledTitle, text: t.cancelledRefundPending };
}

/** The patient's booking: what, when, where, and what happens next. */
export async function BookingReceipt({
  booking,
  notice,
}: {
  booking: MyBooking;
  notice?: EmailNotice;
}) {
  const { locale, t: all } = await getDictionary();
  const t = all.booking.mine;
  const when = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const { title, text } = headline(booking, t, locale);
  const rows = [
    [t.rows.session, booking.serviceName],
    [t.rows.physio, booking.physioName ?? t.physio],
    [t.rows.when, when.format(booking.startsAt)],
    [t.rows.where, booking.clinicAddress],
    [t.rows.price, formatEuros(booking.priceCents, locale)],
  ];
  return (
    <div className="flex flex-col gap-5 rounded-[18px] border bg-card p-5 sm:p-8">
      <div className="flex flex-col items-start gap-2">
        <StatusPill status={booking.status} />
        <h1 className="font-heading font-normal text-3xl">{title}</h1>
        <p className="text-muted-foreground">{text}</p>
        {notice && <EmailCallout notice={notice} />}
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
      <NextStep booking={booking} t={t} />
    </div>
  );
}

/** Reload while the payment is confirmed; otherwise back to the clinic's page. */
function NextStep({ booking, t }: { booking: MyBooking; t: Strings }) {
  if (booking.status === "pending_payment") {
    return (
      <Link
        href={`/bookings/${booking.id}`}
        className={buttonVariants({ className: "self-start" })}
      >
        {t.reload}
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
      {confirmed ? t.bookAnother : t.pickTime}
    </Link>
  );
}
