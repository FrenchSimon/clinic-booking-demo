import { DAY_LABELS, DAYS, type OpeningHours } from "../schema";

export function OpeningHoursList({ hours }: { hours: OpeningHours }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
      {DAYS.map((day) => {
        const h = hours[day];
        return (
          <div key={day} className="contents">
            <dt className="border-divider border-b py-2">{DAY_LABELS[day]}</dt>
            <dd
              className={`border-divider border-b py-2 text-right tabular-nums ${h.open ? "" : "text-muted-foreground"}`}
            >
              {h.open ? `${h.from}–${h.to}` : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
