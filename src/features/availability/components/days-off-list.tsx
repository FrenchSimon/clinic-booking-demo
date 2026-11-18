import { Button } from "@/components/ui/button";
import { removeDayOff } from "../actions";
import type { DayOff } from "../table";

// The dates are calendar days: format them in UTC so they never shift.
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatDay = (day: string) => dayFormat.format(new Date(`${day}T12:00Z`));

/** The physio's coming days off, each with a button to remove it. */
export function DaysOffList({ days }: { days: DayOff[] }) {
  if (days.length === 0) {
    return <p className="text-muted-foreground">No day off planned.</p>;
  }
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
                aria-label={`Remove ${label}`}
              >
                Remove
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
