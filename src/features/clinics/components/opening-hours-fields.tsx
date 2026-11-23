"use client";

import { Input } from "@/components/ui/input";
import { clinic } from "@/i18n/en/clinic";
import { fill } from "@/i18n/locale";
import { DAYS, type Day, type OpeningHours } from "../schema";

/** Day names and field labels, in the page's language: plain strings. */
export type HoursStrings = {
  days: Record<Day, string>;
  closed: string;
  from: string;
  until: string;
  legend: string;
};

const ENGLISH: HoursStrings = { days: clinic.days, ...clinic.hours };

type Props = {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  errors?: Partial<Record<string, string>>;
  /** Keys of the errors: "openingHours" reads "openingHours.mon.to". */
  errorPrefix?: string;
  /** The words around the times; English when left out. */
  strings?: HoursStrings;
  /** Overrides strings.legend and strings.closed. */
  legend?: string;
  closedLabel?: string;
};

/** One row per weekday: open or closed, then the opening and closing times. */
export function OpeningHoursFields({
  value,
  onChange,
  errors,
  errorPrefix = "openingHours",
  strings = ENGLISH,
  legend = strings.legend,
  closedLabel = strings.closed,
}: Props) {
  const name = (day: Day) => strings.days[day];
  const toggle = (day: Day, open: boolean) =>
    onChange({
      ...value,
      [day]: open ? { open, from: "08:00", to: "19:00" } : { open },
    });
  const setTime = (day: Day, key: "from" | "to", time: string) => {
    const current = value[day];
    if (current.open)
      onChange({ ...value, [day]: { ...current, [key]: time } });
  };

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-2 font-medium text-sm">{legend}</legend>
      {DAYS.map((day) => {
        const hours = value[day];
        const error =
          errors?.[`${errorPrefix}.${day}.to`] ??
          errors?.[`${errorPrefix}.${day}.from`];
        return (
          <div
            key={day}
            className="flex flex-col gap-1 border-divider border-b py-2 last:border-b-0"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <label className="flex min-h-11 w-32 items-center gap-2.5">
                <input
                  type="checkbox"
                  name={`${day}.open`}
                  checked={hours.open}
                  onChange={(e) => toggle(day, e.target.checked)}
                  className="size-5 accent-primary"
                />
                <span>{name(day)}</span>
              </label>
              {hours.open ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    name={`${day}.from`}
                    aria-label={fill(strings.from, { day: name(day) })}
                    value={hours.from}
                    onChange={(e) => setTime(day, "from", e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="w-28"
                  />
                  <span aria-hidden="true">–</span>
                  <Input
                    type="time"
                    name={`${day}.to`}
                    aria-label={fill(strings.until, { day: name(day) })}
                    value={hours.to}
                    onChange={(e) => setTime(day, "to", e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="w-28"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {closedLabel}
                </span>
              )}
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );
      })}
    </fieldset>
  );
}
