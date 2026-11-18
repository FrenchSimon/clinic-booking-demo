// Rounded in stat cards, two decimals for an exact amount (DESIGN.md, formats).
const rounded = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const exact = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});
const monthName = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  timeZone: "UTC",
});

/** The owner's four figures: two on a row on a phone, four from `md:`. */
export function StatCards({
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
  const month = monthName.format(new Date(`${today}T12:00:00Z`));
  const bookings = (n: number) => (n === 1 ? "booking" : "bookings");
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <Card label="Today" value={String(todayCount)}>
        {bookings(todayCount)}
      </Card>
      <Card label="This week" value={String(weekCount)}>
        {bookings(weekCount)}
      </Card>
      <Card
        label={`Revenue, ${month}`}
        value={rounded.format(revenueCents / 100)}
      >
        paid by card
      </Card>
      <Card label="Cancelled" value={String(cancelledCount)}>
        {exact.format(refundedCents / 100)} refunded
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
