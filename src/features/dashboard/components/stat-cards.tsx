import { dateFormat, moneyFormat } from "@/i18n/format";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";

// Rounded in stat cards, two decimals for an exact amount (DESIGN.md, formats).

/** The owner's four figures: two on a row on a phone, four from `md:`. */
export async function StatCards({
  today,
  todayCount,
  weekCount,
  revenueCents,
  cancelledCount,
  refundedCents,
}: {
  today: string;
  todayCount: number;
  weekCount: number;
  revenueCents: number;
  cancelledCount: number;
  refundedCents: number;
}) {
  const { locale, t } = await getDictionary();
  const d = t.clinic.dashboard;
  const month = dateFormat(locale, { month: "long", timeZone: "UTC" }).format(
    new Date(`${today}T12:00:00Z`),
  );
  // French counts 0 and 1 as singular, English only 1.
  const bookings = (n: number) =>
    n === 1 || (locale === "fr" && n === 0) ? d.bookingOne : d.bookingMany;
  const rounded = moneyFormat(locale, { rounded: true });
  const exact = moneyFormat(locale);
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <Card label={d.today} value={String(todayCount)}>
        {bookings(todayCount)}
      </Card>
      <Card label={d.thisWeek} value={String(weekCount)}>
        {bookings(weekCount)}
      </Card>
      <Card
        label={fill(d.revenue, { month })}
        value={rounded.format(revenueCents / 100)}
      >
        {d.paidByCard}
      </Card>
      <Card label={d.cancelled} value={String(cancelledCount)}>
        {fill(d.refunded, { amount: exact.format(refundedCents / 100) })}
      </Card>
    </dl>
  );
}

function Card({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border bg-card px-4 py-4 sm:px-5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-heading font-semibold text-3xl sm:text-[34px]">
        {value}
      </dd>
      <dd className="text-muted-foreground text-sm">{children}</dd>
    </div>
  );
}
