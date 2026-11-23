import { StatusPill } from "@/features/booking/components/status-pill";
import { formatEuros } from "@/features/services/schema";
import { dateFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { ClinicBooking } from "../queries";

/** What the owner sees of one booking: status, who, what, when and price. */
export async function ClinicBookingCard({
  booking,
}: {
  booking: ClinicBooking;
}) {
  const { locale, t } = await getDictionary();
  const r = t.clinic.bookings.rows;
  const when = dateFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const rows = [
    [r.patient, booking.patientEmail ?? t.clinic.common.staffBooking],
    [r.session, booking.serviceName],
    [r.physio, booking.physioName ?? t.clinic.common.physio],
    [r.when, when.format(booking.startsAt)],
    [r.price, formatEuros(booking.priceCents, locale)],
  ];
  return (
    <div className="flex flex-col gap-5 rounded-[18px] border bg-card p-5 sm:p-8">
      <div className="flex flex-col items-start gap-2">
        <StatusPill status={booking.status} />
        <h1 className="font-heading font-normal text-3xl">
          {booking.serviceName}
        </h1>
      </div>
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-6 border-divider border-b py-2.5 last:border-b-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-all text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
