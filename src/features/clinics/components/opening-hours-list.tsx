import { DAY_LABELS, DAYS, type OpeningHours } from "../schema";

export function OpeningHoursList({ hours }: { hours: OpeningHours }) {
  return (
    <dl className="flex flex-col">
      {DAYS.map((day) => {
        const h = hours[day];
        return (
          <div
            key={day}
            className="flex justify-between gap-6 border-divider border-b py-2 last:border-b-0"
          >
            <dt>{DAY_LABELS[day]}</dt>
            <dd
              className={`tabular-nums ${h.open ? "" : "text-muted-foreground"}`}
            >
              {h.open ? `${h.from}–${h.to}` : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
