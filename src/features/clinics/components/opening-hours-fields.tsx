"use client";

import { Input } from "@/components/ui/input";
import { DAY_LABELS, DAYS, type Day, type OpeningHours } from "../schema";

type Props = {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  errors?: Partial<Record<string, string>>;
};

/** One row per weekday: open or closed, then the opening and closing times. */
export function OpeningHoursFields({ value, onChange, errors }: Props) {
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
      <legend className="mb-2 font-medium text-sm">Opening hours</legend>
      {DAYS.map((day) => {
        const hours = value[day];
        const error =
          errors?.[`openingHours.${day}.to`] ??
          errors?.[`openingHours.${day}.from`];
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
                <span>{DAY_LABELS[day]}</span>
              </label>
              {hours.open ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    name={`${day}.from`}
                    aria-label={`${DAY_LABELS[day]} opens at`}
                    value={hours.from}
                    onChange={(e) => setTime(day, "from", e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="w-28"
                  />
                  <span aria-hidden="true">–</span>
                  <Input
                    type="time"
                    name={`${day}.to`}
                    aria-label={`${DAY_LABELS[day]} closes at`}
                    value={hours.to}
                    onChange={(e) => setTime(day, "to", e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="w-28"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Closed</span>
              )}
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );
      })}
    </fieldset>
  );
}
