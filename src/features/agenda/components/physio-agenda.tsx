import { dateFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { getAgenda } from "../queries";
import { SessionList } from "./session-list";

const noon = (date: string) => new Date(`${date}T12:00:00Z`);

/** The physio's Today tab (checklist #17): today's sessions, then the week's. */
export async function PhysioAgenda({
  userId,
  clinicId,
}: {
  userId: string;
  clinicId: string;
}) {
  const { date, today, week } = await getAgenda(userId, clinicId);
  const { locale, t } = await getDictionary();
  const a = t.clinic.agenda;
  // Calendar days: their noon in UTC, so no time zone moves them.
  const longDay = dateFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const shortDay = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-oak text-sm uppercase tracking-[0.08em]">
          {a.label}
        </p>
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {longDay.format(noon(date))}
        </h1>
      </div>
      <section
        aria-labelledby="agenda-today-title"
        className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
      >
        <h2
          id="agenda-today-title"
          className="border-divider border-b px-4 py-4 font-semibold text-[17px] sm:px-5"
        >
          {a.today}
        </h2>
        {today.length === 0 ? (
          <p className="px-4 py-5 text-muted-foreground sm:px-5">
            {a.noneToday}
          </p>
        ) : (
          <SessionList sessions={today} />
        )}
      </section>
      <section
        aria-labelledby="agenda-week-title"
        className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
      >
        <h2
          id="agenda-week-title"
          className="border-divider border-b px-4 py-4 font-semibold text-[17px] sm:px-5"
        >
          {a.thisWeek}
        </h2>
        {week.length === 0 ? (
          <p className="px-4 py-5 text-muted-foreground sm:px-5">
            {a.noneThisWeek}
          </p>
        ) : (
          week.map((day) => (
            <div
              key={day.date}
              className="border-divider border-b last:border-b-0"
            >
              <h3 className="bg-muted px-4 py-2.5 font-semibold text-[13px] text-muted-foreground uppercase tracking-[0.06em] sm:px-5">
                {shortDay.format(noon(day.date))}
              </h3>
              <SessionList sessions={day.sessions} />
            </div>
          ))
        )}
      </section>
    </>
  );
}
