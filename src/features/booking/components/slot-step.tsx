import Link from "next/link";
import { cn } from "@/lib/utils";
import { type Selection, selectionHref } from "../selection";
import { addDays } from "../time";
import { Step } from "./step";

// Calendar days: format them in UTC so they never shift.
const weekdayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});
const noon = (day: string) => new Date(`${day}T12:00:00Z`);

/** A row of days, then the free times of the chosen day. Never a month calendar. */
export function SlotStep({
  slug,
  selection,
  times,
  today,
  days,
}: {
  slug: string;
  selection: Selection;
  times: Map<string, string[]>;
  today: string;
  days: number;
}) {
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i));
  const dayTimes = selection.day ? (times.get(selection.day) ?? []) : [];

  return (
    <Step number={3} title="Day and time">
      {times.size === 0 ? (
        <p className="rounded-[14px] border bg-card p-4">
          No free time in the next two weeks
          {selection.physio === "any" ? "." : " with this physio. Try Any."}
        </p>
      ) : (
        <>
          <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {dates.map((day) => (
              <li key={day} className="shrink-0">
                <DayChoice
                  day={day}
                  open={times.has(day)}
                  current={day === selection.day}
                  href={selectionHref(slug, selection, { day })}
                />
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {dayTimes.map((time) => {
              const current = time === selection.at;
              return (
                <li key={time}>
                  <Link
                    href={selectionHref(slug, selection, { at: time })}
                    scroll={false}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-center rounded-[10px] border bg-card tabular-nums",
                      current &&
                        "border-2 border-primary bg-accent font-semibold",
                    )}
                  >
                    {time}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Step>
  );
}

function DayChoice({
  day,
  open,
  current,
  href,
}: {
  day: string;
  open: boolean;
  current: boolean;
  href: string;
}) {
  const label = (
    <>
      <span className="block text-xs">{weekdayFormat.format(noon(day))}</span>
      <strong>{noon(day).getUTCDate()}</strong>
    </>
  );
  const box =
    "flex min-h-[58px] w-14 flex-col items-center justify-center rounded-[12px]";
  if (!open) {
    return (
      <span
        aria-disabled="true"
        title="No free time"
        className={cn(box, "border border-dashed text-muted-foreground")}
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={current ? "true" : undefined}
      className={cn(
        box,
        current ? "bg-primary text-primary-foreground" : "border bg-card",
      )}
    >
      {label}
    </Link>
  );
}
