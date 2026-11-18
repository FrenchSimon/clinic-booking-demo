import { StatusPill } from "@/features/booking/components/status-pill";
import { formatEuros } from "@/features/services/schema";
import type { ClinicBooking } from "../queries";

const when = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Brussels",
});

/** What the owner sees of one booking: status, who, what, when and price. */
export function ClinicBookingCard({ booking }: { booking: ClinicBooking }) {
  const rows = [
    ["Patient", booking.patientEmail ?? "Staff booking"],
    ["Session", booking.serviceName],
    ["Physio", booking.physioName ?? "Physio"],
    ["When", when.format(booking.startsAt)],
    ["Price", formatEuros(booking.priceCents)],
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
