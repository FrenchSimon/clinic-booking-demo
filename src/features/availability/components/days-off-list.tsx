import { Button } from "@/components/ui/button";
import { dateFormat } from "@/i18n/format";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { removeDayOff } from "../actions";
import type { DayOff } from "../table";

/** The physio's coming days off, each with a button to remove it. */
export async function DaysOffList({ days }: { days: DayOff[] }) {
  const { locale, t } = await getDictionary();
  if (days.length === 0) {
    return <p className="text-muted-foreground">{t.team.hours.noDayOff}</p>;
  }
  // Calendar days at noon UTC: still the same day in Brussels.
  const dayFormat = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const formatDay = (day: string) =>
    dayFormat.format(new Date(`${day}T12:00Z`));
  return (
    <ul className="flex flex-col">
      {days.map((d) => {
        const label =
          d.startsOn === d.endsOn
            ? formatDay(d.startsOn)
            : `${formatDay(d.startsOn)} – ${formatDay(d.endsOn)}`;
        return (
          <li
            key={d.id}
            className="flex items-center justify-between gap-4 border-divider border-b py-2 last:border-b-0"
          >
            <span>{label}</span>
            <form action={removeDayOff}>
              <input type="hidden" name="id" value={d.id} />
              <Button
                type="submit"
                variant="ghost"
                aria-label={fill(t.team.hours.removeLabel, { day: label })}
              >
                {t.team.hours.remove}
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
