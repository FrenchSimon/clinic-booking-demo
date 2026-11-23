import { getDictionary } from "@/i18n/server";
import { DAYS, type OpeningHours } from "../schema";

export async function OpeningHoursList({ hours }: { hours: OpeningHours }) {
  const { t } = await getDictionary();
  return (
    <dl className="flex flex-col">
      {DAYS.map((day) => {
        const h = hours[day];
        return (
          <div
            key={day}
            className="flex justify-between gap-6 border-divider border-b py-2 last:border-b-0"
          >
            <dt>{t.clinic.days[day]}</dt>
            <dd
              className={`tabular-nums ${h.open ? "" : "text-muted-foreground"}`}
            >
              {h.open ? `${h.from}–${h.to}` : t.clinic.hours.closed}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
